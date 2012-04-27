var demoCanvas = $('#demoCanvas')[0],
    context = demoCanvas.getContext('2d'),
    touchColors = {};
    
// handle pointer down events
eve.on('pointer.multi.down', function(absXY, relXY) {
    var touchData = relXY;
    while (touchData) {
        touchColors[relXY.id] = 'hsl(' + ~~(Math.random() * 360) + ', 100%, 50%)';
        touchData = touchData.next;
    } // while
});

eve.on('pointer.multi.move', function(absXY, relXY) {
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

interact.watch(demoCanvas, {
    detailed: true
});