#!/bin/bash

set -ex

brew install rabbitmq

/usr/local/sbin/rabbitmq-plugins enable --offline rabbitmq_web_stomp
echo 'web_stomp.ws_frame = binary' >> /usr/local/etc/rabbitmq/rabbitmq.conf

brew services run rabbitmq
brew services list
