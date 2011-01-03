function attachMouse(target, opts, binder) {
    // wire up the events
    binder('mousedown', touchStart, false);
    binder('mousemove', touchMove, false);
    binder('mouseup', touchEnd, false);
    
    // handle mouse wheel events
    binder("mousewheel", wheelie, window);
    binder("DOMMouseScroll", wheelie, window);
} // attachMouse

// register the mouse pointer
register('pointer', {
    attach: attachMouse,
    detach: detachMouse,
    checks: {
        touch: false
    }
});