#!/usr/bin/env bash

fswatch -r src -o | xargs -n1 -I{} sh -c 'npm run build; date'
