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

    function deltaGreaterThan(value) {
        return Math.abs(totalDeltaX) > value || Math.abs(totalDeltaY) > value;
    } // deltaGreaterThan
    
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
        // if the total delta is within tolerances then trigger a tap also
        if (! deltaGreaterThan(MAXMOVE_TAP)) {
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