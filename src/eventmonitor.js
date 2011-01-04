var EventMonitor = function(target, handlers, params) {
    params = COG.extend({
        binder: null,
        unbinder: null,
        observable: null
    }, params);
    
    // initialise variables
    var observable = params.observable,
        handlerInstances = [];
    
    // TODO: check that the binder, unbinder and observable have been supplied
    
    /* internals */
    
    function handlePanMove(evt, absXY, relXY, deltaXY) {
        observable.trigger('pan', deltaXY.x, deltaXY.y);
    } // handlePanMove
    
    /* exports */
    
    function bind() {
        observable.bind.apply(null, arguments);
    } // bind
    
    function pannable(opts) {
        opts = COG.extend({
            inertia: true
        }, opts);
        
        // bind panning
        observable.bind('pointerMove', handlePanMove);
        
        return self;
    } // pannable
    
    function unbind() {
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
    
    return self;
}; 