var demoCanvas = $('#demoCanvas')[0],
    context = demoCanvas.getContext('2d'),
    eventMonitor = INTERACT.watch(demoCanvas, {
        detailed: true
    }),
    touchColors = {};
    
// handle pointer down events
eventMonitor.bind('pointerDownMulti', function(evt, absXY, relXY) {
    var touchData = relXY;
    while (touchData) {
        touchColors[relXY.id] = 'hsl(' + ~~(Math.random() * 360) + ', 100%, 50%)';
        touchData = touchData.next;
    } // while
});

// handle moves
eventMonitor.bind('pointerMoveMulti', function(evt, absXY, relXY) {
    var touchData = relXY;
    
    // clear the display
    context.clearRect(0, 0, demoCanvas.width, demoCanvas.height);
    
    // iterate through the touches and draw them
    while (touchData) {
        context.fillStyle = touchColors[touchData.id];
        
        context.beginPath();
        context.arc(touchData.x, touchData.y, 20, 0, Math.PI * 2, false);
        context.fill();
        
        touchData = touchData.next;
    } // while
});

// handle pointer up events
eventMonitor.bind('pointerUpMulti', function(evt, absXY, relXY, deltaXY) {
    // demos.status('touch ' + relXY.id + ' up');
});