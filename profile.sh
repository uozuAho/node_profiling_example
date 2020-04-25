#!/bin/bash

rm isolate*.log profile_output.*
node --prof doIndex.js
node --prof-process isolate-*.log > profile_output.txt
