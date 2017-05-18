#!/bin/sh
#needs inotify-tools
while inotifywait -e close_write *.js; do browserify main.js -o out.js; done
