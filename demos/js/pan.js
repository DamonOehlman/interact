demos.pan = function() {
	var shifty = document.getElementById('square'),
		eventMonitor = INTERACT.watch(shifty).pannable();
		
	// handle pointer down events
	eventMonitor.bind('pan', function(evt, panX, panY) {
		var currentLeft = parseInt(shifty.style.left, 10),
			currentTop = parseInt(shifty.style.top, 10);
			
		shifty.style.left = ((isNaN(currentLeft) ? 0 : currentLeft) + panX) + "px";
		shifty.style.top = ((isNaN(currentTop) ? 0 : currentTop) + panY) + "px";
	});
};