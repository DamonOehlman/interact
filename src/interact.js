//= require <cog/cog>

/**
# INTERACT
*/
INTERACT = (function() {
    // initialise variables
    var interactorRegistry = {};
    
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

    function ieBind(evtName, callback, customTarget) {
        (customTarget ? customTarget : document).attachEvent('on' + evtName, callback);
    } // ieBind

    function ieUnbind(evtName, callback, customTarget) {
        (customTarget ? customTarget : document).detachEvent('on' + evtName, callback);
    } // ieUnbind
    
    
    /* exports */
    
    function register(typeName, opts) {
        interactorRegistry[typename] = COG.extend({
            attach: null,
            detach: null,
            checks: {}
        });
    } // register
    
    /**
    ### watch(target, opts, caps)
    */
    function watch(target, opts, caps) {
        // initialise the options
        opts = COG.extend({
            bindToBody: false,
            isIE: false,
            types: null
        }, opts);
        
        // initialise the capabilities
        capabilities = COG.extend({
            touch: 'ontouchstart' in window
        }, caps);
        
        // initialise the binder function
        var binder = opts.isIE ? ieBind : genBinder(opts.bindToBody),
            unbinder = opts.isIE ? ieUnbind : genUnbinder(opts.bindToBody),
            interactors = getInteractors(opts.types, capabilities);
    } // watch
    
    //= require "mouse"
    // TODO: require "touch"
    
    return {
        register: register,
        watch: watch
    };
})();