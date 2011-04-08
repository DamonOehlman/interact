var InertiaMonitor = function(upX, upY, params) {
    params = COG.extend({
        inertiaTrigger: 20
    }, params);
    
    // initialise constants
    var INERTIA_TIMEOUT = 300,
        INERTIA_DURATION = 300,
        INERTIA_MAXDIST = 500;
    
    var startTicks = new Date().getTime(),
        worker;
        
    /* internals */
    
    function calcDistance(x1, y1, x2, y2) {
        var distX = x1 - x2,
            distY = y1 - y2;

        return Math.sqrt(distX * distX + distY * distY);
    } // calcDistance    
    
    function calculateInertia(currentX, currentY, distance, tickDiff) {
        var theta = Math.asin((upY - currentY) / distance),
            // TODO: remove the magic numbers from here (pass through animation time from view, and determine max from dimensions)
            extraDistance = distance * (INERTIA_DURATION / tickDiff) >> 0;
            
        // ensure that the extra distance does not exist the max distance
        extraDistance = extraDistance > INERTIA_MAXDIST ? INERTIA_MAXDIST : extraDistance;
            
        // calculate theta
        theta = currentX > upX ? theta : Math.PI - theta;

        // trigger the inertia event
        self.trigger(
            'inertia',
            upX, 
            upY,
            Math.cos(theta) * extraDistance | 0,
            Math.sin(theta) * -extraDistance | 0);
    } // calculateInertia    
    
    /* exports */
    
    function check(currentX, currentY) {
        // update monitor variables
        var distance = calcDistance(upX, upY, currentX, currentY),
            tickDiff = new Date().getTime() - startTicks;
        
        // calculate the inertia
        if ((tickDiff < INERTIA_TIMEOUT) && (distance > params.inertiaTrigger)) {
            calculateInertia(currentX, currentY, distance, tickDiff);
        }
        else if (tickDiff > INERTIA_TIMEOUT) {
            self.trigger('timeout');
        } // if..else
    } // check
    
    var self = {
        check: check
    };
    
    // make observable
    COG.observable(self);
    
    return self;
};