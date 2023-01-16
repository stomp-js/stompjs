#!/bin/bash

set -ex

docker build -t rabbitmq:official-alpine-with-webstomp rabbitmq/
docker run -d --hostname rabbitmq --name rabbitmq \
  -p 15674:15674 -p 61613:61613 \
  rabbitmq:official-alpine-with-webstomp
