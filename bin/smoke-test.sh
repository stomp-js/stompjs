#!/usr/bin/env bash

set -ex

node spec/smoke/commonjs.cjs

node spec/smoke/browser-umd.mjs