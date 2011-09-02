CWD=`pwd`

build:
	@interleave -o interact.js src/interact.js
	
test:
	# node test/db.js

.PHONY: test