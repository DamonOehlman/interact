var fs = require('fs'),
    path = require('path'),
    interleave = require('interleave');

task('default', function() {
    // build each of the builds
    interleave('src/', {
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')),
        path: '.',
        after: ['uglify']
    });    
});