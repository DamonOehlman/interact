var TouchHandler = function(targetElement, observable, opts) {
    // initialise constants
    var DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 5,
        MIN_MOVEDIST = 7,
        EMPTY_TOUCH_DATA = {
            x: 0,
            y: 0
        };

    // define the touch modes
    var TOUCH_MODE_UNKNOWN = 0,
        TOUCH_MODE_TAP = 1,
        TOUCH_MODE_MOVE = 2,
        TOUCH_MODE_PINCH = 3;    
    
    // initialise variables
    var offset,
        touchMode,
        touchDown = false,
        touchesStart,
        touchesCurrent,
        startDistance,
        touchesLast,
        scaling = 1;

    /* internal functions */
    
    function calcChange(first, second) {
        var srcVector = (first && (first.count > 0)) ? first.touches[0] : null;
        if (srcVector && second && (second.count > 0)) {
            return calcDiff(srcVector, second.touches[0]);
        } // if

        return null;
    } // calcChange
    
    // TODO: modify this function to provide distance between any of the touches
    // rather then just the first two
    function calcTouchDistance(touchData) {
        if (touchData.count < 2) { 
            return 0; 
        } // if
        
        var xDist = touchData.x - touchData.next.x,
            yDist = touchData.y - touchData.next.y;

        // return the floored distance to keep math in the realm of integers...
        return ~~Math.sqrt(xDist * xDist + yDist * yDist);
    } // touches
    
    function copyTouches(src) {
        var firstTouch = {
                x: src.x,
                y: src.y,
                count: src.count
            },
            touchData = firstTouch;
            
        while (src.next) {
            src = src.next;
            
            touchData = touchData.next = {
                x: src.x,
                y: src.y
            };
        } // while
        
        return firstTouch;
    } // copyTouches
    
    function getTouchCenter(touchData) {
        var x1 = touchData.x,
            x2 = touchData.next.x,
            y1 = touchData.y,
            y2 = touchData.next.y,
            minX = x1 < x2 ? x1 : x2,
            minY = y1 < y2 ? y1 : y2,
            width = Math.abs(x1 - x2),
            height = Math.abs(y1 - y2);
            
        return {
            x: minX + ~~(width / 2),
            y: minY + ~~(height / 2)
        };
    } // getTouchCenter
    
    function getTouchData(evt, evtProp) {
        var touches = evt[evtProp ? evtProp : 'touches'],
            firstTouch = {
                x: touches[0].pageX,
                y: touches[0].pageY,
                count: touches.length
            },
            touchData = firstTouch;
            
        for (var ii = 1, touchCount = touches.length; ii < touchCount; ii++) {
            touchData = touchData.next = {
                x: touches[ii].pageX,
                y: touches[ii].pageY
            };
        } // for
        
        return firstTouch;
    } // fillTouchData
    
    function handleTouchStart(evt) {
        var targ = evt.target ? evt.target : evt.srcElement;
        
        if (targ && (targ === targetElement)) {
            touchesStart = getTouchData(evt);
            offset = getOffset(targetElement);
            
            // reset the touch mode to unknown
            touchMode = TOUCH_MODE_TAP;
            
            // trigger the pointer down event
            observable.trigger(
                'pointerDown', 
                touchesStart, 
                pointerOffset(touchesStart, offset)
            );
            
            // check the start distance
            if (touchesStart.count > 0) {
                startDistance = calcTouchDistance(touchesStart);
            } // if
            
            // reset the scaling
            scaling = 1;
            
            // update the last touches
            touchesLast = copyTouches(touchesStart);
        } // if
    } // handleTouchStart
    
    function handleTouchMove(evt) {
        var targ = evt.target ? evt.target : evt.srcElement;
        
        if (targ && (targ === targetElement)) {
            // prevent the default action
            evt.preventDefault();
            
            // fill the touch data
            touchesCurrent = getTouchData(evt);
            
            // if the touch mode is currently tap, then check the distance from the start touch
            if (touchMode == TOUCH_MODE_TAP) {
                var cancelTap = 
                        Math.abs(touchesStart.x - touchesCurrent.x) > MIN_MOVEDIST || 
                        Math.abs(touchesStart.y - touchesCurrent.y) > MIN_MOVEDIST;

                // update the touch mode based on the result
                touchMode = cancelTap ? TOUCH_MODE_UNKNOWN : TOUCH_MODE_TAP;
            } // if
            
            if (touchMode != TOUCH_MODE_TAP) {
                touchMode = touchesCurrent.count > 1 ? TOUCH_MODE_PINCH : TOUCH_MODE_MOVE;

                // TOUCH_MODE_PINCH extra checks
                // if we had multiple touches, then the touch mode is probably pinch, but we
                // need to check this by checking the zoom distance between the start touches 
                // and the current touches
                if (touchMode == TOUCH_MODE_PINCH) {
                    // check that the first touches have two touches, if not copy the current touches
                    if (touchesStart.count === 1) {
                        touchesStart = copyTouches(touchesCurrent);
                        startDistance = calcTouchDistance(touchesStart);
                    }
                    else {
                        // calculate the current distance
                        var touchDistance = calcTouchDistance(touchesCurrent),
                            distanceDelta = Math.abs(startDistance - touchDistance);
                        
                        // if the distance is not great enough then switch back to move 
                        if (distanceDelta < THRESHOLD_PINCHZOOM) {
                            touchMode == TOUCH_MODE_MOVE;
                        }
                        // otherwise, raise the zoom event
                        else {
                            var current = getTouchCenter(touchesCurrent),
                                currentScaling = touchDistance / startDistance,
                                scaleChange = currentScaling - scaling;

                            /*
                            COG.info('zooming, center x = ' + current.x, 
                                'y = ' + current.y,
                                'scaleChange = ' + scaleChange);
                            */
                                
                            // trigger the zoom event
                            observable.trigger(
                                'zoom', 
                                current, 
                                pointerOffset(current, offset),
                                scaleChange
                            );
                            
                            // update the scaling
                            scaling = currentScaling;
                        } // if..else
                    } // if..else
                } // if
                
                // if the touch mode is move, then trigger a pointer move on the first touch
                if (touchMode == TOUCH_MODE_MOVE) {
                    // trigger the pointer move event
                    observable.trigger(
                        'pointerMove',
                        touchesCurrent,
                        pointerOffset(touchesCurrent, offset),
                        point(
                            touchesLast.x - touchesCurrent.x, 
                            touchesLast.y - touchesCurrent.y)
                    );
                } // if
            } // if
            
            touchesLast = copyTouches(touchesCurrent);
        } // if
    } // handleTouchMove
    
    function handleTouchEnd(evt) {
        
    } // handleTouchEnd
    
    function initTouchData() {
        return {
            x: 0,
            y: 0,
            next: null
        };
    } // initTouchData

    /* exports */
    
    function unbind() {
        opts.unbinder('touchstart', handleTouchStart, false);
        opts.unbinder('touchmove', handleTouchMove, false);
        opts.unbinder('touchend', handleTouchEnd, false);
    } // unbind
    
    // wire up the event handlers
    opts.binder('touchstart', handleTouchStart, false);
    opts.binder('touchmove', handleTouchMove, false);
    opts.binder('touchend', handleTouchEnd, false);
    
    COG.info('initialized touch handler');
    
    return {
        unbind: unbind
    };
}; // TouchHandler

// register the mouse pointer
register('pointer', {
    handler: TouchHandler,
    checks: {
        touch: true
    }
});