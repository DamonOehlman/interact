//= require <cog/cog>

/**
# INTERACT
*/
INTERACT = (function() {
    // initialise variables
    var interactors = [];
    
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
        for (var ii = interactors.length; ii--; ) {
            var interactor = interactors[ii],
                selected = (! types) || (types.indexOf(interactor.type) >= 0),
                checksPass = true;
                
            // TODO: perform capabilities check
            for (var checkKey in interactor.checks) {
                var check = interactor.checks[checkKey];
                COG.Log.info('checking ' + checkKey + ' capability. require: ' + check + ', capability = ' + capabilities[checkKey]);
                
                checksPass = checksPass && (check === capabilities[checkKey]);
            } // for
            
            if (selected && checksPass) {
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
        interactors.push(COG.extend({
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
    //= require "interactors/touch"
    
    return {
        register: register,
        watch: watch
    };
})();