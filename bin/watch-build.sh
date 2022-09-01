#!/usr/bin/env bash

npx onchange -i -k 'src/**/*' -- npm run build
