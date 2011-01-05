function status(msg) {
    $('#status').html(msg);
} // status

var demos = (function() {
    var loadedDemos = {},
        canvas = null;
    
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
            
            $('#demoCode')[0].innerText = demoHandler.toString();
            prettyPrint();
        } // if
    } // showDemo
    
    /* exports */
    
    function loadDemo(demo, callback) {
        $('ul#demos a').removeClass('active');

        // if the demo is loaded, then run it
        if (loadedDemos[demo]) {
            if (callback) {
                callback(demo);
            } // if
        }
        else {
            loadScript('js/' + demo + '.js', function() {
                loadedDemos[demo] = true;
                if (callback) {
                    callback(demo);
                } // if
            });
        } // if..else
    } // runDemo
    
    function runDemo() {
        loadDemo(this.href.replace(/^.*#(.*)$/, '$1'), function(demo) {
            showDemo(demo);
        });
    }
    
    /* initialization */    
    
    $(document).ready(function() {
        canvas = $('#demoCanvas')[0];
        
        $('ul#demos a').click(runDemo);
        loadDemo.apply($('ul#demos a')[0]);
    });
    
    var self = {
        eventMonitor: null,
        
        load: loadDemo
    };
    
    return self;
})();
