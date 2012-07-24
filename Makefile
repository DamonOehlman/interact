SHELL := /bin/bash

build:
	@interleave build --wrap=amd,glob

test:
	@mocha --reporter spec

.PHONY: test