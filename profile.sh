#!/bin/bash

node --prof doIndex.js
node --prof-process isolate-*.log > profile_output.txt
