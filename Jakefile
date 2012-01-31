var interleave = require('interleave');

task('default', function() {
    // build each of the builds
    interleave('src/', {
        after: ['uglify']
    });    
});