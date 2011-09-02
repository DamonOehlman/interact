// an example config, replace this file with your own
(function() {
    var canvas;
    
    function createCanvas() {
        var demoContainer = RUNNER.getContainer();
        
        if (! canvas) {
            canvas = document.createElement('canvas');

            // initialise the canvas height and width
            canvas.id = 'demoCanvas';
            canvas.width = demoContainer.offsetWidth;
            canvas.height = demoContainer.offsetHeight;

            // add the canvas to the demo container
            demoContainer.appendChild(canvas);
        } // if
    } // createCanvas
    
    function removeCanvas() {
        if (canvas && canvas.parentNode) {
            RUNNER.getContainer().removeChild(canvas);
            canvas = null;
        } // if
    }
    
    RUNNER.configure({
        deps: [
            '../interact.js'
        ],
        
        setup: createCanvas,
        teardown: removeCanvas
    });

    /* register the demos */
    
    RUNNER.add('simple/draw');
    RUNNER.add('simple/panning');
    RUNNER.add('simple/zoom');
    
    RUNNER.add('multitouch/circles');
})();

