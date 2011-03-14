var MouseHandler = function(targetElement, observable, opts) {
    opts = COG.extend({
    }, opts);
    
    // initialise constants
    var WHEEL_DELTA_STEP = 120,
        WHEEL_DELTA_LEVEL = WHEEL_DELTA_STEP * 8;
    
    // initialise variables
    var ignoreButton = opts.isIE,
        isFlashCanvas = typeof FlashCanvas != 'undefined',
        buttonDown = false,
        start,
        currentX,
        currentY,
        lastX,
        lastY;
    
    /* internal functions */
    
    function getPagePos(evt) {
        if (evt.pageX && evt.pageY) {
            return point(evt.pageX, evt.pageY);
        }
        else {
            var doc = document.documentElement,
    			body = document.body;

            // code from jquery event handling:
            // https://github.com/jquery/jquery/blob/1.5.1/src/event.js#L493
            return point(
                evt.clientX + 
                    (doc && doc.scrollLeft || body && body.scrollLeft || 0) - 
                    (doc && doc.clientLeft || body && body.clientLeft || 0),
                evt.clientY + 
                    (doc && doc.scrollTop  || body && body.scrollTop  || 0) - 
                    (doc && doc.clientTop  || body && body.clientTop  || 0)
            );
        } // if
    } // getPagePos
    
    function handleClick(evt) {
        if (matchTarget(evt, targetElement)) {
            var clickXY = getPagePos(evt);
            
            observable.triggerCustom(
                'tap',
                genEventProps('mouse', evt),
                clickXY, 
                pointerOffset(clickXY, getOffset(targetElement))
            );
        } // if
    } // handleClick
    
    function handleDoubleClick(evt) {
        COG.info('captured double click');
        
        if (matchTarget(evt, targetElement)) {
            var clickXY = getPagePos(evt);
            
            observable.triggerCustom(
                'doubleTap', 
                genEventProps('mouse', evt),
                clickXY, 
                pointerOffset(clickXY, getOffset(targetElement))
            );
        } // if
    } // handleDoubleClick    
    
    function handleMouseDown(evt) {
        if (matchTarget(evt, targetElement)) {
            buttonDown = isLeftButton(evt);
            
            if (buttonDown) {
                var pagePos = getPagePos(evt);
                
                // update the cursor and prevent the default
                targetElement.style.cursor = 'move';
                preventDefault(evt);
                
                lastX = pagePos.x; 
                lastY = pagePos.y;
                start = point(lastX, lastY);
                
                // trigger the pointer down event
                observable.triggerCustom(
                    'pointerDown', 
                    genEventProps('mouse', evt),
                    start, 
                    pointerOffset(start, getOffset(targetElement))
                );
            }
        } // if
    } // mouseDown
    
    function handleMouseMove(evt) {
        var pagePos = getPagePos(evt);
        
        // capture the current x and current y
        currentX = pagePos.x;
        currentY = pagePos.y;
        
        if (matchTarget(evt, targetElement)) {
            triggerCurrent(evt, buttonDown ? 'pointerMove' : 'pointerHover');
        } // if
    } // mouseMove

    function handleMouseUp(evt) {
        if (buttonDown && isLeftButton(evt)) {
            buttonDown = false;
            
            // if the button was released on this element, then trigger the event
            if (matchTarget(evt, targetElement)) {
                targetElement.style.cursor = 'default';
                triggerCurrent(evt, 'pointerUp');
            } // if
        } // if
    } // mouseUp
    
    function handleWheel(evt) {
        if (matchTarget(evt, targetElement)) {
            var deltaY;
            
            // handle IE behaviour
            evt = evt || window.event;
            
            if (evt.detail) {
                deltaY = evt.axis === 2 ? -evt.detail * WHEEL_DELTA_STEP : 0;
            }
            else {
                deltaY = evt.wheelDeltaY ? evt.wheelDeltaY : evt.wheelDelta;
                if (window.opera) {
                    deltaY = -deltaY;
                } // if
            } // if..else
            
            if (deltaY !== 0) {
                var current = point(currentX, currentY);
                
                observable.triggerCustom(
                    'zoom', 
                    genEventProps('mouse', evt),
                    current, 
                    pointerOffset(current, getOffset(targetElement)),
                    deltaY / WHEEL_DELTA_LEVEL,
                    'wheel'
                );
                
                preventDefault(evt); 
                evt.returnValue = false;
            } // if
        } // if
    } // handleWheel
    
    function isLeftButton(evt) {
        evt = evt || window.event;
        var button = evt.which || evt.button;
        return button == 1;
    } // leftPressed
    
    function triggerCurrent(evt, eventName, overrideX, overrideY, updateLast) {
        var evtX = typeof overrideX != 'undefined' ? overrideX : currentX,
            evtY = typeof overrideY != 'undefined' ? overrideY : currentY,
            deltaX = evtX - lastX,
            deltaY = evtY - lastY,
            current = point(evtX, evtY);
            
        // trigger the event
        observable.triggerCustom(
            eventName, 
            genEventProps('mouse', evt),
            current,
            pointerOffset(current, getOffset(targetElement)),
            point(deltaX, deltaY)
        );
        
        // if we should update the last x and y, then do that now
        if (typeof updateLast == 'undefined' || updateLast) {
            lastX = evtX;
            lastY = evtY;
        } // if
    } // triggerCurrent

    /* exports */
    
    function unbind() {
        // wire up the event handlers
        opts.unbinder('mousedown', handleMouseDown, false);
        opts.unbinder('mousemove', handleMouseMove, false);
        opts.unbinder('mouseup', handleMouseUp, false);

        // bind mouse wheel events
        opts.unbinder("mousewheel", handleWheel, document);
        opts.unbinder("DOMMouseScroll", handleWheel, document);
    } // unbind
    
    // wire up the event handlers
    opts.binder('mousedown', handleMouseDown, false);
    opts.binder('mousemove', handleMouseMove, false);
    opts.binder('mouseup', handleMouseUp, false);
    // opts.binder('click', handleClick, false);
    opts.binder('dblclick', handleDoubleClick, false);
    
    // bind mouse wheel events
    opts.binder('mousewheel', handleWheel, document);
    opts.binder('DOMMouseScroll', handleWheel, document);
    
    return {
        unbind: unbind
    };
}; // MouseHandler

// register the mouse pointer
register('pointer', {
    handler: MouseHandler,
    checks: {
        touch: false
    }
});