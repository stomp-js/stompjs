#!/usr/bin/env bash

rm -rf docs/

./node_modules/.bin/compodoc \
        -p tsconfig.json \
        -d docs/ \
        --disablePrivate --disableInternal --disableGraph \
        --includes docs-src --includesName Guides \
        --theme Vagrant --hideGenerator \
        "$@"
