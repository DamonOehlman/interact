// req: shim[js#Array.indexOf], eve

// initialise variables
var interactors = [],
    reLastChunk = /.*\.(.*)$/,
    supportedEvents = ['down', 'move', 'up'],
    lastXY = {};

/* internal functions */

function genBinder(target) {
    return function(evtName, callback) {
        target.addEventListener(evtName, callback, false);
    };
} // bindDoc

function genUnbinder(target) {
    return function(evtName, callback, customTarget) {
        target.removeEventListener(evtName, callback, false);
    };
} // unbindDoc

function genIEBinder(target) {
    return function(evtName, callback) {
        target.attachEvent('on' + evtName, callback);
    };
} // genIEBinder

function genIEUnbinder(target) {
    return function(evtName, callback) {
        target.detachEvent('on' + evtName, callback);
    };
} // genIEUnbinder

function getHandlers(types, capabilities) {
    var handlers = [];
    
    // iterate through the interactors in the registry
    for (var ii = interactors.length; ii--; ) {
        var interactor = interactors[ii],
            selected = (! types) || (types.indexOf(interactor.type) >= 0),
            checksPass = true;
            
        // TODO: perform capabilities check
        for (var checkKey in interactor.checks) {
            var check = interactor.checks[checkKey];
            // _log('checking ' + checkKey + ' capability. require: ' + check + ', capability = ' + capabilities[checkKey]);
            
            checksPass = checksPass && (check === capabilities[checkKey]);
        } // for
        
        if (selected && checksPass) {
            handlers[handlers.length] = interactor.handler;
        } // if
    } // for
    
    return handlers;
} // getHandlers

function point(x, y) {
    return {
        x: x ? x : 0,
        y: y ? y : 0,
        count: 1
    };
} // point

/* exports */

/*\
 * Interact.register
 [ function ]
 **
 * Register an interaction handler
 **
 > Arguments
 **
 - typeName (string) the name of the interaction handler being registered
 - opts (object) an object containing options for the new interactor
\*/
function register(typeName, opts) {
    // initialise options
    opts = opts || {};
    opts.checks = opts.checks || {};
    opts.type = opts.type || typeName;
    
    interactors.push(opts);
} // register

function Interactor(target, opts, caps) {
    var handlers, events = {}, ii;
    
    // if the target is a string, then look for the element
    if (typeof target == 'string') {
        target = document.getElementById(target);
    } // if
    
    // initialise options
    opts = opts || {};
    opts.isIE = typeof window.attachEvent != 'undefined';
    
    // initialise the namespace
    this.ns = opts.ns = opts.ns || 'interact';
    
    // initialise the events that we will monitor
    opts.events = opts.events || supportedEvents;
    
    // convert the events array into an object
    for (ii = 0; ii < supportedEvents.length; ii++) {
        events[supportedEvents[ii]] = opts.events.indexOf(supportedEvents[ii]) >= 0;
    }
    
    // copy the events object into the opts
    opts.events = events;
    
    // init caps
    caps = caps || {};
    caps.touch = caps.touch || 'ontouchstart' in window;
    
    // initialise the binder and unbinder
    opts.binder = (opts.isIE ? genIEBinder : genBinder)(opts.bindTarget || document);
    opts.unbinder = (opts.isIE ? genIEBinder : genUnbinder)(opts.bindTarget || document);
    
    // initialise the handlers
    handlers = getHandlers(opts.types, caps);
    for (ii = 0; ii < handlers.length; ii++) {
        handlers[ii].call(target, target, opts);
    } // for
}

Interactor.prototype.on = function(name, handler) {
    eve.on(this.ns + '.' + name, handler);
    return this;
};

function interact(target, opts, caps) {
    return new Interactor(target, opts, caps);
} // watch

/* common pointer (mouse, touch, etc) functions */

function getOffset(obj) {
    var calcLeft = 0, 
        calcTop = 0;

    if (obj.offsetParent) {
        do {
            calcLeft += obj.offsetLeft;
            calcTop += obj.offsetTop;

            obj = obj.offsetParent;
        } while (obj);
    } // if

    return {
        left: calcLeft,
        top: calcTop
    };
} // getOffset

function matchTarget(evt, targetElement) {
    var targ = evt.target || evt.srcElement;
    
    // while we have a target, and that target is not the target element continue
    // additionally, if we hit an element that has an interactor bound to it (will have the class interactor)
    // then also stop
    while (targ && (targ !== targetElement)) {
        targ = targ.parentNode;
    } // while
    
    return targ && (targ === targetElement);
} // matchTarget

function pointerOffset(absPoint, offset) {
    return {
        x: absPoint.x - (offset ? offset.left : 0),
        y: absPoint.y - (offset ? offset.top : 0)
    };    
} // triggerPositionEvent

function preventDefault(evt, immediate) {
    if (evt.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    else if (typeof evt.cancelBubble != 'undefined') {
        evt.cancelBubble = true;
    } // if..else
    
    if (immediate && evt.stopImmediatePropagation) {
        evt.stopImmediatePropagation();
    } // if
} // preventDefault
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
                targetElement.style.cursor = 'move';
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
        if (buttonDown && isLeftButton(evt) && opts.events.up) {
            buttonDown = false;
            
            // if the button was released on this element, then trigger the event
            if (matchTarget(evt, targetElement)) {
                targetElement.style.cursor = 'default';
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
    if (opts.events.down || opts.events.up) {
        opts.binder('mousedown', handleMouseDown);
    }
    
    if (opts.events.move) {
        opts.binder('mousemove', handleMouseMove);
    }
    
    if (opts.events.up) {
        opts.binder('mouseup', handleMouseUp);
    }
    
    opts.binder('dblclick', handleDoubleClick);
    
    // handle drag start and select start events to ensure moves work on ie
    opts.binder('selectstart', preventDrag);
    opts.binder('dragstart', preventDrag);
    
    // bind mouse wheel events
    opts.binder('mousewheel', handleWheel);
    opts.binder('DOMMouseScroll', handleWheel);
    
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
/**
# TouchHandler(targetElement, opts)

## Valid Options

- detailed: boolean (default = false)
- inertia: boolean (default = false)
*/
var TouchHandler = function(targetElement, opts) {
    // initialise opts
    opts = opts || {};
    
    // initialise constants
    var DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 20,
        MIN_MOVEDIST = 7,
        EMPTY_TOUCH_DATA = {
            x: 0,
            y: 0
        },

        // define the touch modes
        TOUCH_MODE_UNKNOWN = 0,
        TOUCH_MODE_TAP = 1,
        TOUCH_MODE_MOVE = 2,
        TOUCH_MODE_PINCH = 3,
        
        // initialise variables
        aggressiveCapture = opts.aggressiveCapture,
        offset,
        touchMode,
        touchDown = false,
        touchesStart,
        touchesCurrent,
        startDistance,
        touchesLast,
        detailedEvents = opts.detailed,
        scaling = 1,
        evtPointer = opts.ns,
        evtTargetId = targetElement && targetElement.id ? '.' + targetElement.id : '',
        evtPointerDown = evtPointer + '.down' + evtTargetId,
        evtPointerMultiDown = evtPointer + '.multi.down' + evtTargetId,
        evtPointerMove = evtPointer + '.move' + evtTargetId,
        evtPointerMultiMove = evtPointer + '.multi.move' + evtTargetId,
        evtPointerUp = evtPointer + '.up' + evtTargetId,
        evtPointerMultiUp = evtPointer + '.multi.up' + evtTargetId,
        evtZoomPinch = evtPointer + '.zoom.pinch' + evtTargetId;

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
    
    function copyTouches(src, adjustX, adjustY) {
        // set to 0 if not supplied
        adjustX = adjustX ? adjustX : 0;
        adjustY = adjustY ? adjustY : 0;
        
        var firstTouch = {
                x: src.x - adjustX,
                y: src.y - adjustY,
                id: src.id,
                count: src.count
            },
            touchData = firstTouch;
            
        while (src.next) {
            src = src.next;
            
            touchData = touchData.next = {
                x: src.x - adjustX,
                y: src.y - adjustY,
                id: src.id
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
            x: minX + (width >> 1),
            y: minY + (height >> 1)
        };
    } // getTouchCenter
    
    function getTouchData(evt, evtProp) {
        var touches = evt[evtProp ? evtProp : 'touches'],
            firstTouch, touchData;
            
        if (touches.length === 0) {
            return null;
        } // if
            
        // assign the first touch and touch data
        touchData = firstTouch = {
                x: touches[0].pageX,
                y: touches[0].pageY,
                id: touches[0].identifier,
                count: touches.length
        };
            
        for (var ii = 1, touchCount = touches.length; ii < touchCount; ii++) {
            touchData = touchData.next = {
                x: touches[ii].pageX,
                y: touches[ii].pageY,
                id: touches[ii].identifier
            };
        } // for
        
        return firstTouch;
    } // fillTouchData
    
    function handleTouchStart(evt) {
        if (matchTarget(evt, targetElement)) {
            // update the offset
            offset = getOffset(targetElement);

            // initialise variables
            var changedTouches = getTouchData(evt, 'changedTouches'),
                relTouches = copyTouches(changedTouches, offset.left, offset.top),
                evtArgs = [targetElement, evt, changedTouches, relTouches];
            
            // prevent the default action
            if (aggressiveCapture) {
                preventDefault(evt, true);
            }

            if (! touchesStart) {
                // reset the touch mode to unknown
                touchMode = TOUCH_MODE_TAP;
                eve.apply(eve, [evtPointerDown].concat(evtArgs));
            } // if
            
            // if we are providing detailed events, then trigger the pointer down multi
            if (detailedEvents) {
                eve.apply(eve, [evtPointerMultiDown].concat(evtArgs));
            } // if
            
            touchesStart = getTouchData(evt);
            
            // check the start distance
            if (touchesStart.count > 1) {
                startDistance = calcTouchDistance(touchesStart);
            } // if
            
            // reset the scaling
            scaling = 1;
            
            // update the last touches
            touchesLast = copyTouches(touchesStart);
        } // if
    } // handleTouchStart
    
    function handleTouchMove(evt) {
        var cancelTap, evtArgs;
        
        if (matchTarget(evt, targetElement)) {
            // prevent the default action
            if (aggressiveCapture) {
                preventDefault(evt, true);
            }

            // fill the touch data
            touchesCurrent = getTouchData(evt);
            
            // if the touch mode is currently tap, then check the distance from the start touch
            if (touchMode == TOUCH_MODE_TAP) {
                cancelTap = 
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
                            touchMode = TOUCH_MODE_MOVE;
                        }
                        // otherwise, raise the zoom event
                        else {
                            var current = getTouchCenter(touchesCurrent),
                                currentScaling = touchDistance / startDistance,
                                scaleChange = currentScaling - scaling;
                                
                            // trigger the zoom event
                            eve(evtZoomPinch, targetElement, evt, current, 
                                pointerOffset(current, offset), scaleChange);
                            
                            // update the scaling
                            scaling = currentScaling;
                        } // if..else
                    } // if..else
                } // if

                // initialise the event args
                evtArgs = [
                    targetElement,
                    evt,
                    touchesCurrent,
                    copyTouches(touchesCurrent, offset.left, offset.top),
                    point(touchesCurrent.x - touchesLast.x, touchesCurrent.y - touchesLast.y)
                ];
                
                // if the touch mode is move, then trigger a pointer move on the first touch
                if (touchMode == TOUCH_MODE_MOVE) {
                    // trigger the pointer move event
                    eve.apply(eve, [evtPointerMove].concat(evtArgs));
                } // if
                
                // fire a touch multi event for custom event handling
                if (detailedEvents) {
                    eve.apply(eve, [evePointerMultiMove].concat(evtArgs));
                } // if
            } // if
            
            touchesLast = copyTouches(touchesCurrent);
        } // if
    } // handleTouchMove
    
    function handleTouchEnd(evt) {
        if (matchTarget(evt, targetElement) && opts.events.up) {
            var changedTouches = getTouchData(evt, 'changedTouches'),
                offsetTouches = copyTouches(changedTouches, offset.left, offset.top),
                evtArgs = [targetElement, evt, changedTouches, offsetTouches];
            
            // get the current touches
            touchesCurrent = getTouchData(evt);
            
            // prevent the default action
            if (aggressiveCapture) {
                preventDefault(evt, true);
            }

            // if this is the last touch to be removed do some extra checks
            if (! touchesCurrent) {
                eve.apply(eve, [evtPointerUp].concat(evtArgs));
                touchesStart = null;
            } // if
            
            // if we are monitoring detailed events, then trigger up multi
            if (detailedEvents) {
                eve.apply(evt, [evtPointerMultiUp].concat(evtArgs));
            } // if..else
        } // if
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
        opts.unbinder('touchstart', handleTouchStart);
        opts.unbinder('touchmove', handleTouchMove);
        opts.unbinder('touchend', handleTouchEnd);
    } // unbind
    
    // wire up the event handlers
    if (opts.events.down || opts.events.up) {
        opts.binder('touchstart', handleTouchStart);
    }
    
    if (opts.events.move) {
        opts.binder('touchmove', handleTouchMove);
    }
    
    if (opts.events.up) {
        opts.binder('touchend', handleTouchEnd);
    }
    
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

// add some helpful wrappers
// TODO: make work with different event namespaces
eve.on('interact.down', function(evt, absXY, relXY) {
    var ctrlName = eve.nt().replace(reLastChunk, '$1');
    
    if (ctrlName) {
        lastXY[ctrlName] = {
            x: relXY.x,
            y: relXY.y
        };
    } // if
    
    // save the down target
    downTarget = this;
});    

// handle pointer move events
eve.on('interact.move', function(evt, absXY, relXY) {
    var ctrlName = eve.nt().replace(reLastChunk, '$1');
    
    if (ctrlName && lastXY[ctrlName]) {
        var deltaX = relXY.x - lastXY[ctrlName].x,
            deltaY = relXY.y - lastXY[ctrlName].y;

        // trigger the pan event
        eve('interact.pan.' + ctrlName, this, evt, deltaX, deltaY, absXY, relXY);

        // update the last xy
        lastXY[ctrlName] = {
            x: relXY.x,
            y: relXY.y
        };
    } // if
});

eve.on('interact.up', function(evt, absXY, relXY) {
    var ctrlName = eve.nt().replace(reLastChunk, '$1');
    
    if (this === downTarget) {
        eve('interact.tap' + (ctrlName ? '.' + ctrlName : ''), this, evt, absXY, relXY);
    } // if
});

interact.register = register;
interact.watch = interact;