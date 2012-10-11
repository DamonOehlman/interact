var MouseHandler = function(targetElement, opts) {
    // initialise opts
    opts = opts || {};
    
    // initialise constants
    var WHEEL_DELTA_STEP = 120,
        WHEEL_DELTA_LEVEL = WHEEL_DELTA_STEP * 8;
    
    // initialise variables
    var aggressiveCapture = opts.aggressiveCapture,
        ignoreButton = opts.isIE,
        isFlashCanvas = typeof FlashCanvas != 'undefined',
        buttonDown = false,
        start,
        currentX,
        currentY,
        evtPointer = opts.ns,
        evtTargetId = targetElement && targetElement.id ? '.' + targetElement.id : '',
        evtPointerDown = evtPointer + '.down' + evtTargetId,
        evtPointerMove = evtPointer + '.move' + evtTargetId,
        evtPointerUp = evtPointer + '.up' + evtTargetId,
        evtZoomWheel = opts.ns + '.zoom.wheel' + evtTargetId;
    
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
    
    function handleDoubleClick(evt) {
        if (matchTarget(evt, targetElement)) {
            var clickXY = getPagePos(evt);
            
            eve(
                evtPointer + '.doubletap' + evtTargetId,
                targetElement,
                evt,
                clickXY, 
                pointerOffset(clickXY, getOffset(targetElement))
            );
        } // if
    } // handleDoubleClick    
    
    function handleMouseDown(evt) {
        if (matchTarget(evt, targetElement)) {
            buttonDown = isLeftButton(evt);
            if (aggressiveCapture) {
                preventDefault(evt, true);
            }
            
            if (buttonDown) {
                var pagePos = getPagePos(evt);
                
                // update the cursor and prevent the default
                if (typeof targetElement.style != 'undefined') {
                    targetElement.style.cursor = 'move';
                }
                
                start = point(pagePos.x, pagePos.y);
                
                // trigger the pointer down event
                eve(
                    evtPointerDown, 
                    targetElement,
                    evt,
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
            triggerCurrent(evt, evtPointer + '.'+ (buttonDown ? 'move' : 'hover'));
        } // if
    } // mouseMove

    function handleMouseUp(evt) {
        // 27/06/2012 (DJO): buttonDown state no longer checked to determine whether or not the event
        // should be fired
        if (isLeftButton(evt)) {
            buttonDown = false;
            
            // if the button was released on this element, then trigger the event
            if (matchTarget(evt, targetElement)) {
                if (typeof targetElement.style != 'undefined') {
                    targetElement.style.cursor = 'default';
                }
                
                triggerCurrent(evt, evtPointer + '.up');
            } // if
        } // if
    } // mouseUp
    
    function handleWheel(evt) {
        if (matchTarget(evt, targetElement)) {
            var deltaY;
            
            // handle IE behaviour
            evt = evt || window.event;
            
            if (evt.detail) {
                if (typeof evt.axis == 'undefined' || evt.axis === 2) {
                    deltaY = -evt.detail * WHEEL_DELTA_STEP;
                } // if
            }
            else {
                deltaY = evt.wheelDeltaY ? evt.wheelDeltaY : evt.wheelDelta;
                if (window.opera) {
                    deltaY = -deltaY;
                } // if
            } // if..else
            
            if (deltaY) {
                var current = point(currentX, currentY);
                
                eve(
                    evtZoomWheel,
                    targetElement,
                    evt,
                    current, 
                    pointerOffset(current, getOffset(targetElement)),
                    deltaY / WHEEL_DELTA_LEVEL
                );
                
                if (aggressiveCapture) {
                    preventDefault(evt, true);
                }

                evt.returnValue = false;
            } // if
        } // if
    } // handleWheel
    
    function isLeftButton(evt) {
        evt = evt || window.event;
        var button = evt.which || evt.button;
        return button == 1;
    } // leftPressed
    
    function preventDrag(evt) {
        return !matchTarget(evt, targetElement);
    } // preventDrag
    
    function triggerCurrent(evt, eventName, overrideX, overrideY, updateLast) {
        var evtX = typeof overrideX != 'undefined' ? overrideX : currentX,
            evtY = typeof overrideY != 'undefined' ? overrideY : currentY,
            current = point(evtX, evtY);
            
        if (aggressiveCapture) {
            preventDefault(evt, true);
        }
        
        // trigger the event
        eve(
            eventName + evtTargetId,
            targetElement,
            evt,
            current,
            pointerOffset(current, getOffset(targetElement))
        );
    } // triggerCurrent

    /* exports */
    
    function unbind() {
        // wire up the event handlers
        opts.unbinder('mousedown', handleMouseDown);
        opts.unbinder('mousemove', handleMouseMove);
        opts.unbinder('mouseup', handleMouseUp);

        // bind mouse wheel events
        opts.unbinder("mousewheel", handleWheel);
        opts.unbinder("DOMMouseScroll", handleWheel);
    } // unbind
    
    // wire up the event handlers
    if (opts.events.down) {
        opts.binder('mousedown', handleMouseDown);
        opts.binder('dblclick', handleDoubleClick);
    }
    
    if (opts.events.move) {
        opts.binder('mousemove', handleMouseMove);
    }
    
    if (opts.events.up) {
        opts.binder('mouseup', handleMouseUp);
    }
    
    // handle drag start and select start events to ensure moves work on ie
    opts.binder('selectstart', preventDrag);
    opts.binder('dragstart', preventDrag);
    
    // bind mouse wheel events (if we are handling zoom events)
    if (opts.events.zoom) {
        opts.binder('mousewheel', handleWheel);
        opts.binder('DOMMouseScroll', handleWheel);
    }
    
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