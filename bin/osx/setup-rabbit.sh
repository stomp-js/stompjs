#!/bin/bash

set -ex

brew install rabbitmq

# Path depends on whether Apple or Intel silicon is in use, https://www.rabbitmq.com/docs/install-homebrew
/opt/homebrew/sbin/rabbitmq-plugins enable --offline rabbitmq_web_stomp
echo 'web_stomp.ws_frame = binary' >>/opt/homebrew/etc/rabbitmq/rabbitmq.conf

brew services run rabbitmq
brew services list
