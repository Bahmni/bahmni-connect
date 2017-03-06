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

rm -rf dist/*

grunt chrome
cp -r dist/* chromeDist
zip -r bahmni-connect-apps.zip chromeDist/*

rm -rf dist/*

grunt android
cp -r dist/* androidDist





