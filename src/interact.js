//= require <cog/cog>

/**
# INTERACT
*/
INTERACT = (function() {
    // initialise variables
    var interactorRegistry = {};
    
    //= require "eventmonitor"
    
    /* internal functions */
    
    function genBinder(useBody) {
        return function(evtName, callback, customTarget) {
            var target = customTarget ? customTarget : (useBody ? document.body : document);

            target.addEventListener(evtName, callback, false);
        };
    } // bindDoc

    function genUnbinder(useBody) {
        return function(evtName, callback, customTarget) {
            var target = customTarget ? customTarget : (useBody ? document.body : document);

            target.removeEventListener(evtName, callback, false);
        };
    } // unbindDoc
    
    function getHandlers(types, capabilities) {
        var handlers = [];
        
        // iterate through the interactors in the registry
        for (var key in interactorRegistry) {
            var interactor = interactorRegistry[key],
                selected = (! types) || (types.indexOf(key) >= 0);
                
            // TODO: perform capabilities check
            
            if (selected) {
                handlers[handlers.length] = interactor.handler;
            } // if
        } // for
        
        return handlers;
    } // getHandlers

    function ieBind(evtName, callback, customTarget) {
        (customTarget ? customTarget : document).attachEvent('on' + evtName, callback);
    } // ieBind

    function ieUnbind(evtName, callback, customTarget) {
        (customTarget ? customTarget : document).detachEvent('on' + evtName, callback);
    } // ieUnbind
    
    function point(x, y) {
        return {
            x: x ? x : 0,
            y: y ? y : 0
        };
    } // point
    
    /* exports */
    
    function register(typeName, opts) {
        interactorRegistry[typeName] = COG.extend({
            handler: null,
            checks: {}
        }, opts);
    } // register
    
    /**
    ### watch(target, opts, caps)
    */
    function watch(target, opts, caps) {
        // initialise the options
        opts = COG.extend({
            bindToBody: false,
            observable: null,
            isIE: false,
            types: null
        }, opts);
        
        // initialise the capabilities
        capabilities = COG.extend({
            touch: 'ontouchstart' in window
        }, caps);
        
        // check if we need to supply an observable object
        if (! opts.observable) {
            opts.observable = {};
            COG.observable(opts.observable);
        } // if
        
        // initialise the binder and unbinder
        opts.binder = opts.isIE ? ieBind : genBinder(opts.bindToBody);
        opts.unbinder = opts.isIE ? ieUnbind : genUnbinder(opts.bindToBody);
        
        // return the event monitor
        return new EventMonitor(target, getHandlers(opts.types, capabilities), opts);
    } // watch
    
    //= require "interactors/pointer"
    //= require "interactors/mouse"
    // TODO: require "touch"
    
    return {
        register: register,
        watch: watch
    };
})();