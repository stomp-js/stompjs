FROM rabbitmq:3.8.8-alpine

run rabbitmq-plugins enable --offline rabbitmq_web_stomp

run \
    echo 'loopback_users.guest = false' >> /etc/rabbitmq/rabbitmq.conf && \
    echo 'web_stomp.ws_frame = binary' >> /etc/rabbitmq/rabbitmq.conf

EXPOSE 15674
