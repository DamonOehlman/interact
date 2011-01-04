function status(msg) {
    $('#status').html(msg);
} // status

var demos = (function() {
    var loadedDemos = {},
        eventMonitor = null,
        canvas = null;
    
    function loadDemo() {
        var demo = this.href.replace(/^.*#(.*)$/, '$1');
        
        $('ul#demos a').removeClass('active');

        // if the demo is loaded, then run it
        if (loadedDemos[demo]) {
            showDemo(demo);
        }
        else {
            loadScript('js/' + demo + '.js', function() {
                loadedDemos[demo] = true;
                showDemo(demo);
            });
        } // if..else
    } // runDemo
    
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
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if
        
        // if we have a canvas, then clear it
        if (canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        } // if
        
        var demoHandler = demos[demo];
        if (demoHandler) {
            $('a[href="#' + demo + '"]').addClass('active');
            eventMonitor = demoHandler();
            
            $('#demoCode')[0].innerText = demoHandler.toString();
            prettyPrint();
        } // if
    } // showDemo
    
    $(document).ready(function() {
        canvas = $('#demoCanvas')[0];
        
        $('ul#demos a').click(loadDemo);
        loadDemo.apply($('ul#demos a')[0]);
    });
    
    return {};
})();
