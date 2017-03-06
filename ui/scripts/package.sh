#!/bin/bash

export LANG=en_US.UTF-8
set -e

npm cache clean
bower cache clean

npm install
bower install
grunt bundle

mkdir chromeDist
mkdir androidDist

if [ $(pgrep Xvfb) ]; then
    XVFB_PID=$(pgrep Xvfb)
    echo "Killing Xvfb process $XVFB_PID"
    kill $XVFB_PID
fi
export DISPLAY=:99
Xvfb :99 &
XVFB_PID=$!
echo "Starting Xvfb process $XVFB_PID"

rm -rf dist/*

grunt chrome
cp -r dist/* chromeDist
zip -r bahmni-connect-apps.zip chromeDist/*

rm -rf dist/*

grunt android
cp -r dist/* androidDist

echo "Killing Xvfb process $XVFB_PID"
/usr/bin/sudo kill $XVFB_PID





