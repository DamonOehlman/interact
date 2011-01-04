var TouchHandler = function(targetElement, observable, opts) {
    // initialise constants
    var DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 5,
        EMPTY_TOUCH_DATA = {
            x: 0,
            y: 0
        };

    // define the touch modes
    var TOUCH_MODE_TAP = 0,
        TOUCH_MODE_MOVE = 1,
        TOUCH_MODE_PINCH = 2;    
    
    // initialise variables
    var touchMode,
        touchDown = false,
        touchesStart = COG.extend({}, EMPTY_TOUCH_DATA);

    /* internal functions */
    
    function calcChange(first, second) {
        var srcVector = (first && (first.count > 0)) ? first.touches[0] : null;
        if (srcVector && second && (second.count > 0)) {
            return calcDiff(srcVector, second.touches[0]);
        } // if

        return null;
    } // calcChange
    
    function fillTouchData(touchData, evt, evtProp) {
        var touches = evt[evtProp ? evtProp : 'touches'],
            touchCount = touches.length,
            ii = 0;

        do {
            touchData.x = touches[ii].pageX;
            touchData.y = touches[ii].pageY;
            
            ii += 1;
            if (ii >= touchCount) {
                touchData.next = null;
                break;
            } // if
            
            touchData = touchData.next = {
                x: 0,
                y: 0
            };
        } while (true);
    } // fillTouchData
    
    function handleTouchStart(evt) {
        var targ = evt.target ? evt.target : evt.srcElement;
        
        COG.Log.info('captured touch start, target same = ' + targ && (targ === targetElement));
        
        if (targ && (targ === targetElement)) {
            fillTouchData(touchesStart, evt);
            globalTouchesStart = touchesStart;

            // reset the touch mode to unknown
            touchMode = TOUCH_MODE_TAP;
    
            // update the last touches
            // copyTouchData(touchesLast, touchesStart);
        } // if
    } // handleTouchStart
    
    function handleTouchMove(evt) {
        
    } // handleTouchMove
    
    function handleTouchEnd(evt) {
        
    } // handleTouchEnd
    
    function initTouchData() {
        return {
            x: 0,
            y: 0,
            next: null
        };
    } // initTouchData

    /* exports */
    
    function unbind() {
        opts.unbinder('touchstart', handleTouchStart, false);
        opts.unbinder('touchmove', handleTouchMove, false);
        opts.unbinder('touchend', handleTouchEnd, false);
    } // unbind
    
    // wire up the event handlers
    opts.binder('touchstart', handleTouchStart, false);
    opts.binder('touchmove', handleTouchMove, false);
    opts.binder('touchend', handleTouchEnd, false);
    
    COG.Log.info('initialized touch handler');
    
    return {
        unbind: unbind
    };
}; // TouchHandler

// register the mouse pointer
register('pointer', {
    handler: TouchHandler,
    checks: {
        touch: true
    }
});