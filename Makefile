CWD=`pwd`

build:
	@interleave src --after uglify

test:
	# node test/db.js

.PHONY: test