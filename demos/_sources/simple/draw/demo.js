var demoCanvas = $('#demoCanvas')[0],
    context = demoCanvas.getContext('2d');

eve.on('interact.down', function(evt, absXY, relXY) {
    context.beginPath();
    context.moveTo(relXY.x, relXY.y);
});

// handle pointer move events
eve.on('interact.move', function(evt, absXY, relXY) {
    context.lineTo(relXY.x, relXY.y);
    context.stroke();
});

// handle pointer up events
eve.on('interact.up', function(evt, absXY, relXY) {
    context.closePath();
});

interact.watch('demoCanvas');