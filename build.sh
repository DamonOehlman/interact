SPROCKET_OPTS="-I build -I /development/projects/github/sidelab/"
CLOSURE_COMPILER="/development/tools/javascript/closure/compiler.jar"
MINIFY=$1

: ${MINIFY:=false}

# sprocketize the source
sprocketize $SPROCKET_OPTS src/interact.js > interact.js

# minify
if $MINIFY; then
    java -jar $CLOSURE_COMPILER \
         --compilation_level SIMPLE_OPTIMIZATIONS \
         --js_output_file interact.min.js \
         --js interact.js
fi;