// image sourced from: http://commons.wikimedia.org/wiki/File:Black_Hole_in_the_universe.jpg

demos.pan = function() {
    var blackHole = new Image(),
        demoCanvas = $('#demoCanvas')[0],
        eventMonitor = INTERACT.watch(demoCanvas).pannable(),
        context = demoCanvas.getContext('2d'),
        imageX = 0,
        imageY = 0;
        
    function initImage() {
        imageX = -(this.width - demoCanvas.width) / 2;
        imageY = -(this.height - demoCanvas.height) / 2;
        
        // handle pointer down events
        eventMonitor.bind('pan', function(evt, panX, panY) {
            imageX -= panX;
            imageY -= panY;
            
            drawImage();
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
    
    // return the event monitor
    return eventMonitor;
};