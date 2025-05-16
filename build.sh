#!/bin/bash

# install electron-builder to create icons
npm install -g electron-icon-maker

# create build folder for icon
mkdir -p /Users/haozi/Workspace/ElectronJS/RunningSalary/build/icons

# put icon.png 1024x1024 in build/icons folder
cp /Users/haozi/Workspace/ElectronJS/RunningSalary/assets/icon.png /Users/haozi/Workspace/ElectronJS/RunningSalary/build/icons/icon.png

# create icons
electron-icon-maker --input=/Users/haozi/Workspace/ElectronJS/RunningSalary/assets/icon.png --output=/Users/haozi/Workspace/ElectronJS/RunningSalary/build

# build
npm run package


