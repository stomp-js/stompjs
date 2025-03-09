FROM rabbitmq:3.10.25-alpine

RUN rabbitmq-plugins enable --offline rabbitmq_web_stomp

RUN \
    echo 'loopback_users.guest = false' >> /etc/rabbitmq/rabbitmq.conf && \
    echo 'web_stomp.ws_frame = binary' >> /etc/rabbitmq/rabbitmq.conf

EXPOSE 15674
