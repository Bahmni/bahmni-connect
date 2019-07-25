#!/bin/bash

export LANG=en_US.UTF-8
set -e

npm install
bower install

if [ -z "$1" ]; then
    grunt bundle
else
    grunt --gruntfile $1 bundle
fi


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

if [ -z "$1" ]; then
    grunt chrome
else
    grunt --gruntfile $1 chrome
fi


npm run sw
cp -r dist/* bahmni-connect-apps
zip -r bahmni-connect-apps.zip bahmni-connect-apps

rm -rf dist/*

if [ -z "$1" ]; then
    grunt android
else
    grunt --gruntfile $1 android
fi

cp -r dist/* androidDist

echo "Killing Xvfb process $XVFB_PID"
/usr/bin/sudo kill $XVFB_PID
