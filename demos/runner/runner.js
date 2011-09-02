// define the map and gui globals for simplicities sake
var gui = new DAT.GUI();

RUNNER = (function() {
    
    /* internals */
    
    
    // define the demos
    var sampleGui,
        editor,
        demo = {
            group: 'main',
            id: 'simple',
            renderer: 'canvas'
        },
        currentDemo,
        demoCode,
        reTitle = /(?:^|\-)(\w)(\w+)/g,
        reGroup = /^(.*?)\/(.*)$/,
        groups = {},
        groupNames = [],
        idField,
        standardConfig = {},
        registeredDemos = [],
        demoData = {
            'geojson/world': {
                deps: ['data/world.js']
            },
            
            'basic/marker-hit-test': {
                deps: [
                    'data/heatmap-data.js'
                ]                
            },
            
            'plugins/heatmap': {
                deps: [
                    'lib/heatcanvas.js',
                    '../dist/plugins/layers/heatcanvas.js',
                    'data/heatmap-data.js'
                ]
            },
            
            'visualization/walmart': {
                deps: ['data/walmarts.js']
            },
            
            'visualization/earthquakes': {
                deps: ['data/cached-quakes.js']
            }
        },
        startLat = -27.469592089206213,
        startLon = 153.0201530456543;
        
    /* internals */
    
    function buildUI() {
        var groupField = gui.add(demo, 'group');
        
        // initialise the groups
        loadDemoData();
        
        // initialise the group field
        groupField.onChange(selectGroup).options.apply(groupField, groupNames).listen();
        
        // add the demos
        idField = gui.add(demo, 'id');
        idField.onChange(load);
        idField.listen();

        gui.open();
        
        // select the group
        selectGroup(demo.group, location.hash);
        
        // create the editor
        resizeEditor();
        $('#btnRun').click(runCode);
        
        editor = ace.edit('editor');
        editor.setTheme('ace/theme/twilight');
        
        // attach the reload handler to running code instead of reloading the page
        var canon = require('pilot/canon');
        
        canon.addCommand({
            name: 'runCode',
            bindKey: {
                win: 'Ctrl-Return',
                mac: 'Command-Return',
                sender: 'editor'
            },
            exec: function(env, args, request) {
                runCode();
            }
        });

        try {
            var JavaScriptMode = require('ace/mode/javascript').Mode;
            editor.getSession().setMode(new JavaScriptMode());
        }
        catch (e) {
            log('no js highlighting, please run local webserver for this feature');
        } // try..catch 
    } // buildUI
    
    function cleanupLastDemo() {
        if (currentDemo) {
            // if we have a teardown for the demo, then do it here
            var teardownFn = currentDemo.teardown || standardConfig.teardown;
            if (teardownFn) {
                teardownFn.apply(RUNNER);
            } // if
        } // if

        $(RUNNER).trigger('cleanup', currentDemo);
        
        if (sampleGui && sampleGui.domElement) {
            $(sampleGui.domElement).remove();
            sampleGui = null;
        } // if
    } // cleanupLastDemo
    
    function genTitle(id) {
        var title = '',
            match;
            
        // clean up the status text
        reTitle.lastIndex = 0;
        match = reTitle.exec(id.replace(reGroup, '$2'));
        while (match) {
            title += match[1].toUpperCase() + match[2] + ' ';
            match = reTitle.exec(id);
        } // while
        
        return title.trim();
    } // genTitle
    
    function loadDemoData() {
        for (var ii = 0; ii < registeredDemos.length; ii++) {
            var demoId = registeredDemos[ii],
                group = reGroup.test(demoId) ? demoId.replace(reGroup, '$1') : 'main';
                
            // replace the demo with the demo data
            registeredDemos[ii] = demoData[demoId] || {};
            registeredDemos[ii].id = '#' + demoId;
            registeredDemos[ii].group = group;
            
            // if we don't have a title, generate one from the id
            if (! registeredDemos[ii].title) {
                registeredDemos[ii].title = genTitle(demoId);
            } // if
            
            registeredDemos[ii].script = 'js/' + demoId + '/demo.js';
            
            // create the group if not created
            if (! groups[group]) {
                groups[group] = [];
                groupNames[groupNames.length] = group;
            } // if
            
            // add to the group
            groups[group].push(registeredDemos[ii]);
        } // for
    } // loadDemoData
    
    function resizeEditor() {
        var frame = document.getElementById('editorFrame'),
            editor = document.getElementById('editor'),
            editorTools = document.getElementById('editorTools'),
            demoContainer = document.getElementById('demo');
            
        frame.style.width = (document.body.offsetWidth - demoContainer.offsetWidth) + 'px';
        editor.style.height = (frame.offsetHeight - editorTools.offsetHeight) + 'px';
    } // resizeEditor
    
    function selectGroup(groupName, targetDemo, preventLoad) {
        var options = [],
            groupDemos = groups[groupName] || [];
        
        // iterate through the group demos and fill the options
        for (var ii = 0; ii < groupDemos.length; ii++) {
            options[options.length] = groupDemos[ii].title;
        } // for
        
        // update the sample field
        idField.options.apply(idField, options);
        
        // if the prevent load parameter is supplied, then exit
        if (preventLoad) {
            return;
        }
        
        // load the first demo in the options
        load(targetDemo || options[0] || '#simple');
    }
        
    /* exports */
    
    function add(demoId, config) {
        registeredDemos.push(demoId);
        if (config) {
            demoData[demoId] = config;
        } // if
    } // add
    
    function configure(config) {
        var fns = config.fns || {},
            key;
        
        // shallow copy the items
        for (key in config) {
            standardConfig[key] = config[key];
        } // for
        
        // add the extended functions to the runner
        for (key in fns) {
            if (! RUNNER[key]) {
                RUNNER[key] = fns[key];
            } // if
        } // for
    } // configure
    
    function getContainer() {
        return document.getElementById('demo');
    } // getContainer
    
    function init() {
        // build the UI
        buildUI();

        window.addEventListener('resize', function() {
            resizeEditor();
        }, false);
    } // init
    
    function load(demoTitle) {
        var loaderChain = $LAB.setOptions({}),
            deps = standardConfig.deps || [];
            
        // cleanup the last demo
        cleanupLastDemo();
        
        // set the demo title to the first demo if not specified
        demoTitle = demoTitle || registeredDemos[0].title;
        
        // iterate through the demos, look for the requested demo
        for (var ii = 0; ii < registeredDemos.length; ii++) {
            var matchingDemo = 
                registeredDemos[ii].title.toLowerCase() === demoTitle.toLowerCase() || 
                registeredDemos[ii].id === demoTitle;
            
            if (matchingDemo) {
                currentDemo = registeredDemos[ii];
                break;
            }
        } // for

        // default to the first demo if we don't have a proper demo
        currentDemo = currentDemo || registeredDemos[0];
        
        demo.sample = currentDemo.title;
        selectGroup(demo.group = currentDemo.group, null, true);
        location.hash = currentDemo.id;
        
        // add the current demo deps to the list of dependencies
        deps = deps.concat(currentDemo.deps || []);
        
        // add the scripts to the body
        for (var depIdx = 0; depIdx < deps.length; depIdx++) {
            loaderChain = loaderChain.script(deps[depIdx]);
        } // for
    
        loaderChain.wait(function() {
            $.ajax({
                url: currentDemo.script + '?ticks=' + new Date().getTime(),
                dataType: 'text',
                success: function(data) {
                    editor.getSession().setValue(data);
                    runCode();
                }
            });
        });
    } // load
    
    function log(message) {
        if (typeof console.log != 'undefined') {
            console.log(message);
        } // if
    } // log
    
    function makeSampleUI() {
        if (sampleGui && sampleGui.domElement) {
            $(sampleGui.domElement).remove();
        } // if
        
        // create a new sampleUI
        sampleGui = new DAT.GUI();
        
        return {
            gui:sampleGui,
            done: function() {
                sampleGui.open();
            }
        };
    } // makeSampleUI
    
    function runCode() {
        var code = editor.getSession().getValue(),
            setupFn = (currentDemo ? currentDemo.setup : null) || standardConfig.setup;
        
        // cleanup the last demo
        cleanupLastDemo();
        
        // if we have a demo code script, then remove it
        if (demoCode) {
            document.body.removeChild(demoCode);
        } // if
        
        // add a new demo code script
        demoCode = document.createElement('script');
        demoCode.id = 'demoCode';
        demoCode.innerHTML = code;
        
        // setup the current demo
        if (setupFn) {
            setupFn.apply(RUNNER);
        } // if
        
        document.body.appendChild(demoCode);
    } // runCode
    
    return {
        add: add,
        configure: configure,
        getContainer: getContainer,
        init: init,
        load: load,
        log: log,
        
        makeSampleUI: makeSampleUI,
        runCode: runCode
    };
})();