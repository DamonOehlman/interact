/* common pointer (mouse, touch, etc) functions */

function getOffset(obj) {
    var calcLeft = 0, 
        calcTop = 0;
        
    if (obj.offsetParent) {
        do {
            calcLeft += obj.offsetLeft;
            calcTop += obj.offsetTop;

            obj = obj.offsetParent;
        } while (obj);
    } // if
    
    return {
        x: calcLeft,
        y: calcTop
    };
} // getOffset

function matchTarget(evt, targetElement) {
    var targ = evt.target ? evt.target : evt.srcElement;
    while (targ && (targ !== targetElement) && targ.nodeName && (targ.nodeName.toUpperCase() != 'CANVAS')) {
        targ = targ.parentNode;
    } // while
    
    return targ && (targ === targetElement);
} // matchTarget

function pointerOffset(absPoint, offset) {
    return {
        x: absPoint.x - (offset ? offset.x : 0),
        y: absPoint.y - (offset ? offset.y : 0)
    };    
} // triggerPositionEvent

function preventDefault(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    else if (evt.cancelBubble) {
        evt.cancelBubble();
    } // if..else
} // preventDefault