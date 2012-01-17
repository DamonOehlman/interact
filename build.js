var interleave = require('interleave'),
    aliases = {
        cog: 'github://DamonOehlman/cog/cogs/',
        eve: 'github://DmitryBaranovskiy/eve/eve.js'
    };

// build each of the builds
interleave('src/', {
    path: 'dist',
    aliases: aliases,
    after: ['uglify']
});