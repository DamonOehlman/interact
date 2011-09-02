/**
# INTERACT
*/
INTERACT = (function() {
    // initialise variables
    var interactors = [];
    
    function _extend() {
        var target = arguments[0] || {},
            sources = Array.prototype.slice.call(arguments, 1),
            length = sources.length,
            source,
            ii;
    
        for (ii = 0; ii < length; ii++) {
            if ((source = sources[ii]) !== null) {
                for (var name in source) {
                    var copy = source[name];
    
                    if (target === copy) {
                        continue;
                    } // if
    
                    if (copy !== undefined) {
                        target[name] = copy;
                    } // if
                } // for
            } // if
        } // for
    
        return target;
    } // _extend

    function _log(msg, level) {
        if (typeof console !== 'undefined') {
            console[level || 'log'](msg);
        } // if
    } // _log
    
    function _logError(error) {
        if (typeof console !== 'undefined') {
            console.error(error);
            console.log(error.stack);
        } // if
    } // _logError

    var _observable = (function() {
        // initialise variables
        var callbackCounter = 0;
        
        function getHandlers(target) {
            return target.hasOwnProperty('obsHandlers') ? 
                    target.obsHandlers : 
                    null;
        } // getHandlers
    
        function getHandlersForName(target, eventName) {
            var handlers = getHandlers(target);
            if (! handlers[eventName]) {
                handlers[eventName] = [];
            } // if
    
            return handlers[eventName];
        } // getHandlersForName
    
        return function(target) {
            if (! target) { return null; }
    
            /* initialization code */
    
            // check that the target has handlers 
            if (! getHandlers(target)) {
                target.obsHandlers = {};
            } // if
    
            var attached = target.hasOwnProperty('bind');
            if (! attached) {
                target.bind = function(eventName, callback) {
                    var callbackId = "callback" + (callbackCounter++);
                    getHandlersForName(target, eventName).unshift({
                        fn: callback,
                        id: callbackId
                    });
    
                    return callbackId;
                }; // bind
                
                target.triggerCustom = function(eventName, args) {
                    var eventCallbacks = getHandlersForName(target, eventName),
                        evt = {
                            cancel: false,
                            name: eventName,
                            source: this
                        },
                        eventArgs;
                        
                    // if we have arguments, then extend the evt object
                    for (var key in args) {
                        evt[key] = args[key];
                    } // for
    
                    // check that we have callbacks
                    if (! eventCallbacks) {
                        return null;
                    } // if
                    
                    // add the global handlers
                    eventCallbacks = eventCallbacks.concat(getHandlersForName(target, '*'));
                
                    // get the event arguments without the event name
                    eventArgs = Array.prototype.slice.call(arguments, 2);
                    
                    // if the target has defined an event interceptor (just one allowed)
                    // then send it a capture of the event details
                    if (target.eventInterceptor) {
                        target.eventInterceptor(eventName, evt, eventArgs);
                    } // if
    
                    // put the event literal to the start of the event arguments
                    eventArgs.unshift(evt);
    
                    for (var ii = eventCallbacks.length; ii-- && (! evt.cancel); ) {
                        eventCallbacks[ii].fn.apply(this, eventArgs);
                    } // for
                    
                    return evt;                
                };
    
                target.trigger = function(eventName) {
                    var eventArgs = Array.prototype.slice.call(arguments, 1);
                    eventArgs.splice(0, 0, eventName, null);
                    
                    return target.triggerCustom.apply(this, eventArgs);
                }; // trigger
    
                target.unbind = function(eventName, callbackId) {
                    if (typeof eventName === 'undefined') {
                        target.obsHandlers = {};
                    }
                    else {
                        var eventCallbacks = getHandlersForName(target, eventName);
                        for (var ii = 0; eventCallbacks && (ii < eventCallbacks.length); ii++) {
                            if (eventCallbacks[ii].id === callbackId) {
                                eventCallbacks.splice(ii, 1);
                                break;
                            } // if
                        } // for
                    } // if..else
    
                    return target;
                }; // unbind
            } // if
        
            return target;
        };
    })();

    
    var EventMonitor = function(target, handlers, params) {
        params = _extend({
            binder: null,
            unbinder: null,
            observable: null
        }, params);
        
        // initialise constants
        var MAXMOVE_TAP = 20, // pixels
            INERTIA_DURATION = 500, // ms
            INERTIA_MAXDIST = 300, // pixels
            INERTIA_TIMEOUT = 50, // ms
            INERTIA_IDLE_DISTANCE = 15; // pixels
        
        // initialise variables
        var observable = params.observable,
            handlerInstances = [],
            totalDeltaX,
            totalDeltaY;
        
        // TODO: check that the binder, unbinder and observable have been supplied
        
        /* internals */
    
        function handlePointerMove(evt, absXY, relXY, deltaXY) {
            // update the total delta
            totalDeltaX += deltaXY.x || 0;
            totalDeltaY += deltaXY.y || 0;
        } // handlePanMove
        
        function handlePointerDown(evt, absXY, relXY) {
            totalDeltaX = 0;
            totalDeltaY = 0;
        } // handlePointerDown
        
        function handlePointerUp(evt, absXY, relXY) {
            var moveDelta = Math.max(Math.abs(totalDeltaX), Math.abs(totalDeltaY));
            
            // if the total delta is within tolerances then trigger a tap also
            if (moveDelta <= MAXMOVE_TAP) {
                observable.triggerCustom('tap', evt, absXY, relXY);
            } // if
        } // handlePointerUP
        
        /* exports */
        
        function bind() {
            return observable.bind.apply(null, arguments);
        } // bind
        
        function unbind() {
            // unbind all observable handlers
            observable.unbind();
            
            // unbind handler instances
            for (ii = 0; ii < handlerInstances.length; ii++) {
                handlerInstances[ii].unbind();
            } // for
            
            return self;
        } // unbind
        
        /* define the object */
        
        var self = {
            bind: bind,
            unbind: unbind
        };
        
        // iterate through the handlers and attach
        for (var ii = 0; ii < handlers.length; ii++) {
            handlerInstances.push(handlers[ii](target, observable, params));
        } // for
        
        // bind panning
        observable.bind('pointerDown', handlePointerDown);
        observable.bind('pointerMove', handlePointerMove);
        observable.bind('pointerUp', handlePointerUp);
        
        return self;
    }; 

    
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
    
    function register(typeName, opts) {
        interactors.push(_extend({
            handler: null,
            checks: {},
            type: typeName
        }, opts));
    } // register
    
    /**
    ### watch(target, opts, caps)
    */
    function watch(target, opts, caps) {
        // initialise the options
        opts = _extend({
            bindTarget: null,
            observable: null,
            isIE: typeof window.attachEvent != 'undefined',
            types: null
        }, opts);
        
        // initialise the capabilities
        capabilities = _extend({
            touch: 'ontouchstart' in window
        }, caps);
        
        // check if we need to supply an observable object
        if (! opts.observable) {
            opts.observable = _observable({});
            globalOpts = opts;
        } // if
        
        // initialise the binder and unbinder
        opts.binder = (opts.isIE ? genIEBinder : genBinder)(opts.bindTarget || document);
        opts.unbinder = (opts.isIE ? genIEBinder : genUnbinder)(opts.bindTarget || document);
        
        // return the event monitor
        return new EventMonitor(target, getHandlers(opts.types, capabilities), opts);
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
    
    function genEventProps(source, evt) {
        return {
            source: source,
            target: evt.target ? evt.target : evt.srcElement
        };
    } // genEventProps
    
    function matchTarget(evt, targetElement) {
        var targ = evt.target ? evt.target : evt.srcElement,
            targClass = targ.className;
        
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

    var MouseHandler = function(targetElement, observable, opts) {
        opts = _extend({
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
        
        function handleDoubleClick(evt) {
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
                    preventDefault(evt, true);
                    
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
        
        function preventDrag(evt) {
            return !matchTarget(evt, targetElement);
        } // preventDrag
        
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
            opts.unbinder('mousedown', handleMouseDown);
            opts.unbinder('mousemove', handleMouseMove);
            opts.unbinder('mouseup', handleMouseUp);
    
            // bind mouse wheel events
            opts.unbinder("mousewheel", handleWheel);
            opts.unbinder("DOMMouseScroll", handleWheel);
        } // unbind
        
        // wire up the event handlers
        opts.binder('mousedown', handleMouseDown);
        opts.binder('mousemove', handleMouseMove);
        opts.binder('mouseup', handleMouseUp);
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

    var TouchHandler = function(targetElement, observable, opts) {
        opts = _extend({
            detailed: false,
            inertia: false
        }, opts);
        
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
            detailedEvents = opts.detailed,
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
                    relTouches = copyTouches(changedTouches, offset.left, offset.top);
                
                if (! touchesStart) {
                    // reset the touch mode to unknown
                    touchMode = TOUCH_MODE_TAP;
    
                    // trigger the pointer down event
                    observable.triggerCustom(
                        'pointerDown', 
                        genEventProps('touch', evt),
                        changedTouches, 
                        relTouches);
                } // if
                
                // if we are providing detailed events, then trigger the pointer down multi
                if (detailedEvents) {
                    observable.triggerCustom(
                        'pointerDownMulti',
                        genEventProps('touch', evt),
                        changedTouches,
                        relTouches);
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
            if (matchTarget(evt, targetElement)) {
                // prevent the default action
                preventDefault(evt);
                
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
                                touchMode = TOUCH_MODE_MOVE;
                            }
                            // otherwise, raise the zoom event
                            else {
                                var current = getTouchCenter(touchesCurrent),
                                    currentScaling = touchDistance / startDistance,
                                    scaleChange = currentScaling - scaling;
                                    
                                // trigger the zoom event
                                observable.triggerCustom(
                                    'zoom', 
                                    genEventProps('touch', evt),
                                    current, 
                                    pointerOffset(current, offset),
                                    scaleChange,
                                    'pinch'
                                );
                                
                                // update the scaling
                                scaling = currentScaling;
                            } // if..else
                        } // if..else
                    } // if
                    
                    // if the touch mode is move, then trigger a pointer move on the first touch
                    if (touchMode == TOUCH_MODE_MOVE) {
                        // trigger the pointer move event
                        observable.triggerCustom(
                            'pointerMove',
                            genEventProps('touch', evt),
                            touchesCurrent,
                            copyTouches(touchesCurrent, offset.left, offset.top),
                            point(
                                touchesCurrent.x - touchesLast.x, 
                                touchesCurrent.y - touchesLast.y)
                        );
                    } // if
                    
                    // fire a touch multi event for custom event handling
                    if (detailedEvents) {
                        observable.triggerCustom(
                            'pointerMoveMulti', 
                            genEventProps('touch', evt),
                            touchesCurrent, 
                            copyTouches(touchesCurrent, offset.left, offset.top)
                        );
                    } // if
                } // if
                
                touchesLast = copyTouches(touchesCurrent);
            } // if
        } // handleTouchMove
        
        function handleTouchEnd(evt) {
            if (matchTarget(evt, targetElement)) {
                var changedTouches = getTouchData(evt, 'changedTouches'),
                    offsetTouches = copyTouches(changedTouches, offset.left, offset.top);
                
                // get the current touches
                touchesCurrent = getTouchData(evt);
                
                // if this is the last touch to be removed do some extra checks
                if (! touchesCurrent) {
                    // trigger the pointer up
                    observable.triggerCustom(
                        'pointerUp',
                        genEventProps('touch', evt),
                        changedTouches,
                        offsetTouches
                    );
    
                    touchesStart = null;
                } // if
                
                // if we are monitoring detailed events, then trigger up multi
                if (detailedEvents) {
                    // trigger the pointer up
                    observable.triggerCustom(
                        'pointerUpMulti',
                        genEventProps('touch', evt),
                        changedTouches,
                        offsetTouches
                    );
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
        opts.binder('touchstart', handleTouchStart);
        opts.binder('touchmove', handleTouchMove);
        opts.binder('touchend', handleTouchEnd);
        
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

    
    return {
        register: register,
        watch: watch
    };
})();
