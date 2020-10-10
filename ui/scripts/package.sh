#!/bin/bash

export LANG=en_US.UTF-8
set -e

yarn install

if [ -z "$1" ]; then
    yarn bundle
else
    yarn bundle --gruntfile $1
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
    yarn chrome
else
    yarn chrome --gruntfile $1
fi

yarn sw

cp -r dist/* bahmni-connect-apps
zip -r bahmni-connect-apps.zip bahmni-connect-apps

rm -rf dist/*

if [ -z "$1" ]; then
    yarn android
else
    yarn android --gruntfile $1
fi

cp -r dist/* androidDist

echo "Killing Xvfb process $XVFB_PID"
/usr/bin/sudo kill $XVFB_PID
