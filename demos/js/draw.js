demos.draw = function() {
    var demoCanvas = $('#demoCanvas')[0],
        context = demoCanvas.getContext('2d'),
        eventMonitor = demos.eventMonitor = INTERACT.watch(demoCanvas);
    
    // handle pointer down events
    eventMonitor.bind('pointerDown', function(evt, absXY, relXY) {
        demos.status('pointer down', 300);
        
        context.beginPath();
        context.moveTo(relXY.x, relXY.y);
    });

    // handle pointer move events
    eventMonitor.bind('pointerMove', function(evt, absXY, relXY, deltaXY) {
        context.lineTo(relXY.x, relXY.y);
        context.stroke();
    
        demos.status('delta = x: ' + deltaXY.x + ', y: ' + deltaXY.y + '');
    });

    // handle pointer up events
    eventMonitor.bind('pointerUp', function(evt, absXY, relXY, deltaXY) {
        demos.status('pointer up', 300);
    });
};