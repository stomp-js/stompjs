#!/bin/bash

set -ex

# Checkout
mkdir -p tmp/rx-stomp
cd tmp/rx-stomp
git clone --depth 1 https://github.com/stomp-js/rx-stomp develop
cd develop

# npm install
npm ci
npm i ../../../stomp-stompjs-*.tgz

# Test
npm run karma

# Pack
npm pack
