var demos = (function() {
    // initialise constants
    var DEMO_PATH = (function() {
        var regex = /demos\.js/i;
        
        for (var ii = 0; ii < document.scripts.length; ii++) {
            var src = document.scripts[ii].src;
            if (regex.test(src)) {
                return src.replace(/^(.*)\/.*$/, '$1/');
            } // if
        } // for
        
        return '';
    })();
    
    var loadedDemos = {},
        canvas = null,
        statusTimeout = 0;
    
    function loadScript(url, callback) {
        var script = document.createElement('script'),
            head = document.getElementsByTagName('head')[0],
            done = false;
            
        // initialise the script
        script.src = url;
        script.async = true;

        script.onload = script.onreadystatechange = function() {
            callback();
        };
        
        // load the script
        head.appendChild(script);
    } // loadScript
    
    function showDemo(demo) {
        if (self.eventMonitor) {
            self.eventMonitor.unbind();
            self.eventMonitor = null;
        } // if
        
        // if we have a canvas, then clear it
        if (canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        } // if
        
        var demoHandler = demos[demo];
        if (demoHandler) {
            $('a[href="#' + demo + '"]').addClass('active');
            demoHandler();
            self.current = demo;
            
            $('#demoCode')[0].innerText = demoHandler.toString();
            
            // format if pretty print is available
            if (typeof prettyPrint !== 'undefined') {
                prettyPrint();
            } // if
        } // if
    } // showDemo
    
    /* exports */
    
    function loadDemo(demo, callback) {
        $('.demos ul a').removeClass('active');

        // if the demo is loaded, then run it
        if (loadedDemos[demo]) {
            if (callback) {
                callback(demo);
            } // if
        }
        else {
            status('loading demo');
            loadScript(DEMO_PATH + 'js/' + demo + '.js?v=' + new Date().getTime(), function() {
                loadedDemos[demo] = true;
                if (callback) {
                    callback(demo);
                    status('');
                } // if
            });
        } // if..else
    } // runDemo
    
    function status(msg, fadeAfter) {
        clearTimeout(statusTimeout);
        $('#status').html(msg).show();

        if (typeof fadeAfter !== 'undefined') {
            statusTimeout = setTimeout(function() {
                $('#status').fadeOut('fast');
            }, fadeAfter);
        } // if
    } // status
    
    function runDemo() {
        loadDemo(this.href.replace(/^.*#(.*)$/, '$1'), function(demo) {
            showDemo(demo);
        });
    }
    
    /* initialization */    
    
    $(document).ready(function() {
        var firstDemo = $('.demos ul a')[0];
        
        canvas = $('#demoCanvas')[0];
        
        $('.demos ul a').click(runDemo);
        
        if (firstDemo) {
            runDemo.apply(firstDemo);
        } // if
    });
    
    var self = {
        current: null,
        eventMonitor: null,
        
        load: loadDemo,
        status: status,
        show: function(demo) {
            loadDemo(demo, function() {
                showDemo(demo);
            });
        }
    };
    
    return self;
})();
