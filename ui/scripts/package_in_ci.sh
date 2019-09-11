#!/bin/bash

export LANG=en_US.UTF-8
set -e

npm install
bower install
grunt --gruntfile Gruntfile_ci.js bundle

mkdir bahmni-connect-apps
mkdir androidDist

if [ $(pgrep Xvfb) ]; then
    XVFB_PID=$(pgrep Xvfb)
    echo "Killing Xvfb process $XVFB_PID"
    /usr/bin/sudo kill $XVFB_PID
fi
export DISPLAY=:99
Xvfb :99 &
XVFB_PID=$!
echo "Starting Xvfb process $XVFB_PID"

rm -rf dist/*

grunt --gruntfile Gruntfile_ci.js chrome

npm run sw
cp -r dist/* bahmni-connect-apps
zip -r bahmni-connect-apps.zip bahmni-connect-apps

rm -rf dist/*

grunt --gruntfile Gruntfile_ci.js android
cp -r dist/* androidDist

echo "Killing Xvfb process $XVFB_PID"
/usr/bin/sudo kill $XVFB_PID

