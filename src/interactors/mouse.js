var MouseHandler = function(targetElement, observable, opts) {
    // initialise constants
    var WHEEL_DELTA_STEP = 120,
        WHEEL_DELTA_LEVEL = WHEEL_DELTA_STEP * 8;
    
    // initialise variables
    var aggressiveCapture = false,
        buttonDown = false,
        start,
        offset,
        currentX,
        currentY,
        lastX,
        lastY;
    
    /* internal functions */
    
    function handleMouseDown(evt) {
        var targ = evt.target ? evt.target : evt.srcElement;
        
        if (aggressiveCapture || targ && (targ === targetElement)) {
            buttonDown = (evt.button === 0);
            if (buttonDown) {
                lastX = evt.pageX ? evt.pageX : evt.screenX;
                lastY = evt.pageY ? evt.pageY : evt.screenY;
                start = point(lastX, lastY);
                offset = getOffset(targetElement);
                
                observable.trigger(
                    'pointerDown', 
                    start, 
                    pointerOffset(start, offset)
                );
            } // if
        } // if
    } // mouseDown

    function handleMouseMove(evt) {
        var targ = evt.target ? evt.target : evt.srcElement,
            zoomDistance = 0;
            
        // capture the current x and current y
        currentX = evt.pageX ? evt.pageX : evt.screenX;
        currentY = evt.pageY ? evt.pageY : evt.screenY;
        
        if (buttonDown && (aggressiveCapture || targ && (targ === targetElement))) {
            triggerCurrent('pointerMove');
        } // if
    } // mouseMove

    function handleMouseUp(evt) {
        var targ = evt.target ? evt.target : evt.srcElement,
            zoomDistance = 0;
        
        if (buttonDown && (evt.button === 0)) {
            buttonDown = false;
            
            // if the button was released on this element, then trigger the event
            if (aggressiveCapture || targ && (targ === targetElement)) {
                triggerCurrent('pointerUp');
            } // if
            
            // check for inertia
        } // if
    } // mouseUp
    
    function handleWheel(evt) {
        var targ = evt.target ? evt.target : evt.srcElement;
        
        if (aggressiveCapture || targ && (targ === targetElement)) {
            var deltaY;
            
            if (evt.detail) {
                deltaY = evt.axis === 2 ? -evt.detail * WHEEL_DELTA_STEP : 0;
            }
            else {
                deltaY = evt.wheelDeltaY;
            } // if..else
            
            if (deltaY !== 0) {
                var current = point(currentX, currentY);
                
                observable.trigger(
                    'zoom', 
                    current, 
                    pointerOffset(current, offset),
                    deltaY / WHEEL_DELTA_LEVEL
                );
                
                preventDefault(evt); 
            } // if
        } // if
    } // handleWheel    
    
    function triggerCurrent(eventName, includeTotal) {
        var current = point(currentX, currentY);
            
        observable.trigger(
            eventName,
            current,
            pointerOffset(current, offset),
            point(lastX - currentX, lastY - currentY)
        );
        
        lastX = currentX;
        lastY = currentY;
    } // triggerCurrent

    /* exports */
    
    function unbind() {
        // wire up the event handlers
        opts.unbinder('mousedown', handleMouseDown, false);
        opts.unbinder('mousemove', handleMouseMove, false);
        opts.unbinder('mouseup', handleMouseUp, false);

        // bind mouse wheel events
        opts.unbinder("mousewheel", handleWheel, window);
        opts.unbinder("DOMMouseScroll", handleWheel, window);
    } // unbind
    
    // wire up the event handlers
    opts.binder('mousedown', handleMouseDown, false);
    opts.binder('mousemove', handleMouseMove, false);
    opts.binder('mouseup', handleMouseUp, false);
    
    // bind mouse wheel events
    opts.binder("mousewheel", handleWheel, window);
    opts.binder("DOMMouseScroll", handleWheel, window);
    
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