var blackHole = new Image(),
    demoCanvas = $('#demoCanvas')[0],
    eventMonitor = INTERACT.watch(demoCanvas),
    context = demoCanvas.getContext('2d'),
    scaling = 1,
    imageX = 0,
    imageY = 0;
    
function initImage() {
    eventMonitor.bind('zoom', function(evt, absXY, relXY, zoomAmount) {
        scaling = Math.max(0.25, scaling + zoomAmount);
        
        drawImage();
    });
    
    drawImage();
} // initImage

function drawImage() {
    context.save();
    context.clearRect(0, 0, demoCanvas.width, demoCanvas.height);
    
    try {
        context.translate(
            (demoCanvas.width - blackHole.width * scaling) / 2, 
            (demoCanvas.height - blackHole.height * scaling) / 2);
        
        context.drawImage(
            blackHole, 
            imageX, 
            imageY, 
            blackHole.width * scaling, 
            blackHole.height * scaling);
    }
    finally {
        context.restore();
    }
} // drawImage

// load the image
blackHole.src = 'http://estock.s3.amazonaws.com/wwtfc1/24/88/31/estock_commonswiki_248831_o.jpg';
blackHole.onload = initImage;