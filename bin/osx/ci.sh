#!/bin/bash

set -ex

npm run build

# Actual test
npm run karma
