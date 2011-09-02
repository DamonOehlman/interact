var blackHole = new Image(),
    demoCanvas = $('#demoCanvas')[0],
    eventMonitor = INTERACT.watch(demoCanvas),
    context = demoCanvas.getContext('2d'),
    imageX = 0,
    imageY = 0,
    lastX, lastY;
    
function initImage() {
    imageX = -(this.width - demoCanvas.width) / 2;
    imageY = -(this.height - demoCanvas.height) / 2;
    
    // handle pointer down events
    eventMonitor.bind('pointerDown', function(evt, absXY, relXY) {
        lastX = relXY.x;
        lastY = relXY.y;
    });    
    
    // handle pointer move events
    eventMonitor.bind('pointerMove', function(evt, absXY, relXY, deltaXY) {
        imageX += (relXY.x - lastX);
        imageY += (relXY.y - lastY);
        
        drawImage();
        
        // update the last xy
        lastX = relXY.x;
        lastY = relXY.y;
    });
    
    drawImage();
} // initImage

function drawImage() {
    context.clearRect(0, 0, demoCanvas.width, demoCanvas.height);
    context.drawImage(blackHole, imageX, imageY);
} // drawImage

// load the image
blackHole.src = 'http://estock.s3.amazonaws.com/wwtfc1/24/88/31/estock_commonswiki_248831_o.jpg';
blackHole.onload = initImage;