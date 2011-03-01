var EventMonitor = function(target, handlers, params) {
    params = COG.extend({
        binder: null,
        unbinder: null,
        observable: null
    }, params);
    
    // initialise constants
    var MAXMOVE_TAP = 20,
        INERTIA_DURATION = 500,
        INERTIA_MAXDIST = 300,
        INERTIA_TIMEOUT = 50;
    
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
            diffTicks,
            totalTicks = evtCount > 0 ? (new Date().getTime() - events[evtCount-1].ticks) : 0,
            ii;
            
        // iterate back through events and check the total duration
        ii = events.length;
        while (--ii >= 1 && totalTicks < INERTIA_TIMEOUT) {
            totalTicks += (events[ii].ticks - events[ii - 1].ticks);
        } // while
        
        // update the included count
        includedCount = evtCount - ii;
        // COG.info('checking for inertia, total ticks = ' + totalTicks + ', included count = ' + includedCount);
        
        if (includedCount > 1) {
            // now calculate the velocity (ii will be at the coorect index)
            for (; ii < evtCount; ii++) {
                diffX = events[ii].x - events[ii - 1].x;
                diffY = events[ii].y - events[ii - 1].y;
                diffTicks = events[ii].ticks - events[ii - 1].ticks;

                vectorX += diffX / diffTicks;
                vectorY += diffY / diffTicks;
            } // for

            // calculate the estimated pixels per millisecond of the vector, and then time by the duration
            // TODO: make inertia configurable
            vectorX = Math.min((vectorX / includedCount) * INERTIA_DURATION | 0, INERTIA_MAXDIST);
            vectorY = Math.min((vectorY / includedCount) * INERTIA_DURATION | 0, INERTIA_MAXDIST);

            inertiaPan(vectorX, vectorY, COG.easing('quad.out'), INERTIA_DURATION);
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
        for (var ii = 0; ii < handlerInstances.length; ii++) {
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