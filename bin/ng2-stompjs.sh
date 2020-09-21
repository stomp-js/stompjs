#!/bin/bash

set -ex

# Checkout
mkdir -p tmp/ng2-stompjs
cd tmp/ng2-stompjs
git clone --depth 1 https://github.com/stomp-js/ng2-stompjs.git develop
cd develop

# npm install
npm ci
npm i ../../../stomp-stompjs-*.tgz ../../rx-stomp/develop/stomp-rx-stomp-*.tgz

# Test
ng test
