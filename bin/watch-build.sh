#!/usr/bin/env bash

npm run build; date; echo "watching ..."

fswatch -r src -o | xargs -n1 -I{} sh -c 'npm run build; date; echo "watching ..."'
