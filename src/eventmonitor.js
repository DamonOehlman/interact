var EventMonitor = function(target, handlers, params) {
    params = COG.extend({
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
        pannableOpts = null,
        handlerInstances = [],
        pans = [],
        totalDeltaX,
        totalDeltaY;
    
    // TODO: check that the binder, unbinder and observable have been supplied
    
    /* internals */
    
    function checkInertia(events) {
        var evtCount = events.length, 
            includedCount,
            vectorX = 0,
            vectorY = 0,
            diffX, 
            diffY,
            distance, 
            theta,
            extraDistance,
            totalTicks = 0, // evtCount > 0 ? (new Date().getTime() - events[evtCount-1].ticks) : 0,
            xyRatio = 1,
            ii;
            
        // iterate back through events and check the total duration
        ii = events.length;
        while (--ii > 1 && totalTicks < INERTIA_TIMEOUT) {
            totalTicks += (events[ii].ticks - events[ii - 1].ticks);
        } // while
        
        // update the included count
        includedCount = evtCount - ii;
        // COG.info('checking for inertia, total ticks = ' + totalTicks + ', included count = ' + includedCount);
        // console.debug(events);
        
        if (includedCount > 1) {
            diffX = events[evtCount - 1].x - events[ii].x;
            diffY = events[evtCount - 1].y - events[ii].y;
            distance = Math.sqrt(diffX * diffX + diffY * diffY) | 0;
            
            // if the distance is greater than the cutoff, then do the real calcs
            if (distance > INERTIA_IDLE_DISTANCE) {
                diffX = events[evtCount - 1].x - events[0].x;
                diffY = events[evtCount - 1].y - events[0].y;
                distance = Math.sqrt(diffX * diffX + diffY * diffY) | 0;
                theta = Math.asin(diffY / distance);

                // calculate the extra distance
                extraDistance = distance * INERTIA_DURATION / totalTicks | 0;
                extraDistance = extraDistance > INERTIA_MAXDIST ? INERTIA_MAXDIST : extraDistance;

                // run the inertia pan
                inertiaPan(
                    Math.cos(diffX > 0 ? theta : Math.PI - theta) * extraDistance, 
                    Math.sin(theta) * extraDistance, 
                    COG.easing('sine.out'), 
                    INERTIA_DURATION);
            } // if
        } // if
    } // checkInertia
    
    function deltaGreaterThan(value) {
        return Math.abs(totalDeltaX) > value || Math.abs(totalDeltaY) > value;
    } // deltaGreaterThan
    
    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        // if pannable then udpate the pan
        if (pannableOpts) {
            // add the pan to the list
            pans[pans.length] = {
                ticks: new Date().getTime(),
                x: deltaXY.x,
                y: deltaXY.y
            };

            // trigger the pan
            observable.trigger('pan', deltaXY.x, deltaXY.y);
        } // if
        
        // update the total delta
        totalDeltaX += deltaXY.x ? deltaXY.x : 0;
        totalDeltaY += deltaXY.y ? deltaXY.y : 0;
    } // handlePanMove
    
    function handlePointerDown(evt, absXY, relXY) {
        // reset the pan monitor
        pans = [];
        
        totalDeltaX = 0;
        totalDeltaY = 0;
    } // handlePointerDown
    
    function handlePointerUp(evt, absXY, relXY) {
        // if the total delta is within tolerances then trigger a tap also
        if (! deltaGreaterThan(MAXMOVE_TAP)) {
            observable.trigger('tap', absXY, relXY);
        }
        // otherwise, if we are working with a panning interface check for inertia
        else if (pannableOpts) {
            checkInertia(pans);
        }
    } // handlePointerUP
    
    function inertiaPan(changeX, changeY, easing, duration) {
        var currentX = 0,
            currentY = 0,
            lastX = 0;
            
        // COG.info('inertia pan x = ' + changeX + ', y = ' + changeY);
        
        COG.tweenValue(0, changeX, easing, duration, function(val, complete) {
            lastX = currentX;
            currentX = val;
        });
        
        COG.tweenValue(0, changeY, easing, duration, function(val, complete) {
            // trigger the pan
            observable.trigger('pan', currentX - lastX, val - currentY);
            currentY = val;
        });
    } // inertia pan
    
    /* exports */
    
    function bind() {
        return observable.bind.apply(null, arguments);
    } // bind
    
    function pannable(opts) {
        pannableOpts = COG.extend({
            inertia: true
        }, opts);
        
        return self;
    } // pannable
    
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
        pannable: pannable,
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