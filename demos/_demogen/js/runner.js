var DEMORUNNER = (function() {
    
    /* internals */
    
    function bindKeys() {
        // multiple shortcuts that do the same thing
        key('⌘+e, ctrl+e', toggleEditor);
    } // bindKeys
    
    function mapMessageToEve(evt) {
        var eveData = {};
        
        try {
            eveData = JSON.parse(evt.data);
        }
        catch (e) {
            // error parsing the data, 
        } // try..catch
        
        if (eveData.name) {
            eve.apply(null, [eveData.name].concat(eveData.args));
        } // if
    } // mapMessageToEve
    
    function toggleEditor() {
        
    } // toggleEditor
    
    // listen for messages
    window.addEventListener('message', mapMessageToEve, false);
    
    // bind some eve handlers
    eve.on('run', function() {
        if (typeof demo == 'function') {
            demo.apply(null, Array.prototype.slice(arguments, 0));
        } // if
    });
    
    $(bindKeys);
})();

