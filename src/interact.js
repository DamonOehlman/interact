//= eve!

// Interact 0.3.0 - Mouse and Touch Handling
// Copyright (c) 2010-2011 Damon Oehlman (damon.oehlman -at- sidelab.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license
INTERACT = (function() {
    // initialise variables
    var interactors = [],
        reLastChunk = /.*\.(.*)$/,
        lastXY = {};
    
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
        // initialise options
        opts = opts || {};
        opts.checks = opts.checks || {};
        opts.type = opts.type || typeName;
        
        interactors.push(opts);
    } // register
    
    /**
    ### watch(target, opts, caps)
    */
    function watch(target, opts, caps) {
        var handlers;
        
        // if the target is a string, then look for the element
        if (typeof target == 'string') {
            target = document.getElementById(target);
        } // if
        
        // initialise options
        opts = opts || {};
        opts.isIE = typeof window.attachEvent != 'undefined';
        
        // init caps
        caps = caps || {};
        caps.touch = caps.touch || 'ontouchstart' in window;
        
        // initialise the binder and unbinder
        opts.binder = (opts.isIE ? genIEBinder : genBinder)(opts.bindTarget || document);
        opts.unbinder = (opts.isIE ? genIEBinder : genUnbinder)(opts.bindTarget || document);
        
        // initialise the handlers
        handlers = getHandlers(opts.types, caps);
        
        for (var ii = 0; ii < handlers.length; ii++) {
            handlers[ii].call(target, target, opts);
        } // for
    } // watch
    
    //= interactors/pointer
    //= interactors/mouse
    //= interactors/touch
    
    // add some helpful wrappers
    eve.on('interact.pointer.down', function(evt, absXY, relXY) {
        var ctrlName = eve.nt().replace(reLastChunk, '$1');
        
        if (ctrlName) {
            lastXY[ctrlName] = {
                x: relXY.x,
                y: relXY.y
            };
        } // if
        
        // save the down target
        downTarget = this;
    });    
    
    // handle pointer move events
    eve.on('interact.pointer.move', function(evt, absXY, relXY) {
        var ctrlName = eve.nt().replace(reLastChunk, '$1');
        
        if (ctrlName && lastXY[ctrlName]) {
            var deltaX = relXY.x - lastXY[ctrlName].x,
                deltaY = relXY.y - lastXY[ctrlName].y;

            // trigger the pan event
            eve('interact.pan.' + ctrlName, this, evt, deltaX, deltaY, absXY, relXY);

            // update the last xy
            lastXY[ctrlName] = {
                x: relXY.x,
                y: relXY.y
            };
        } // if
    });
    
    eve.on('interact.pointer.up', function(evt, absXY, relXY) {
        var ctrlName = eve.nt().replace(reLastChunk, '$1');
        
        if (this === downTarget) {
            eve('interact.tap' + (ctrlName ? '.' + ctrlName : ''), this, evt, absXY, relXY);
        } // if
    });
    
    return {
        register: register,
        watch: watch
    };
})();