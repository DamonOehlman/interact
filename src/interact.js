/**
# INTERACT
*/
INTERACT = (function() {
    // initialise variables
    var interactors = [];
    
    //= require <cog/cogs/extend>
    //= require <cog/cogs/log>
    //= require <cog/cogs/observable>
    
    //= require "eventmonitor"
    
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
    
    //= require "interactors/pointer"
    //= require "interactors/mouse"
    //= require "interactors/touch"
    
    return {
        register: register,
        watch: watch
    };
})();