var interleave = require('interleave');

// build each of the builds
interleave('src/', {
    path: 'dist',
    after: ['uglify']
});