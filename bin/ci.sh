#!/bin/bash

set -ex

npm run build

# Actual test
npm run lint
npm run test
npm run karma

# Create a package
npm pack
