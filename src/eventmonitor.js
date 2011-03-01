var EventMonitor = function(target, handlers, params) {
    params = COG.extend({
        binder: null,
        unbinder: null,
        observable: null
    }, params);
    
    // initialise constants
    var MAXMOVE_TAP = 20;
    
    // initialise variables
    var observable = params.observable,
        pannableOpts = null,
        handlerInstances = [],
        pans = [],
        totalDeltaX,
        totalDeltaY;
    
    // TODO: check that the binder, unbinder and observable have been supplied
    
    /* internals */
    
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
        COG.info('reset ' + pans.length + ' pan history');
        pans = [];
        
        totalDeltaX = 0;
        totalDeltaY = 0;
    } // handlePointerDown
    
    function handlePointerUp(evt, absXY, relXY) {
        // if the total delta is within tolerances then trigger a tap also
        if (! deltaGreaterThan(MAXMOVE_TAP)) {
            observable.trigger('tap', absXY, relXY);
        } // if
    } // handlePointerUP
    
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