var demoCanvas = $('#demoCanvas')[0],
    context = demoCanvas.getContext('2d');

eve.on('interact.tap', function(evt, absXY, relXY) {
});

INTERACT.watch(demoCanvas);