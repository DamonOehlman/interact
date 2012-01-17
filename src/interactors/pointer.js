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
        left: calcLeft,
        top: calcTop
    };
} // getOffset

function matchTarget(evt, targetElement) {
    var targ = evt.target || evt.srcElement,
        targClass = targ.className;
    
    // while we have a target, and that target is not the target element continue
    // additionally, if we hit an element that has an interactor bound to it (will have the class interactor)
    // then also stop
    while (targ && (targ !== targetElement)) {
        targ = targ.parentNode;
    } // while
    
    return targ && (targ === targetElement);
} // matchTarget

function pointerOffset(absPoint, offset) {
    return {
        x: absPoint.x - (offset ? offset.left : 0),
        y: absPoint.y - (offset ? offset.top : 0)
    };    
} // triggerPositionEvent

function preventDefault(evt, immediate) {
    if (evt.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    else if (typeof evt.cancelBubble != 'undefined') {
        evt.cancelBubble = true;
    } // if..else
    
    if (immediate && evt.stopImmediatePropagation) {
        evt.stopImmediatePropagation();
    } // if
} // preventDefault