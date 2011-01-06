demos.multitouch = function() {
    var demoCanvas = $('#demoCanvas')[0],
        context = demoCanvas.getContext('2d'),
        eventMonitor = demos.eventMonitor = INTERACT.watch(demoCanvas, {
            detailed: true
        });
        
    function drawTouches() {
        
    } // drawTouches
    
    // handle pointer down events
    eventMonitor.bind('pointerDown', function(evt, absXY, relXY) {
        demos.status('touch ' + relXY.id + ' down');
    });

    // handle pointer up events
    eventMonitor.bind('pointerUp', function(evt, absXY, relXY, deltaXY) {
        demos.status('touch ' + relXY.id + ' up');
    });
};