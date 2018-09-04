FROM rabbitmq:3.7.7-alpine

run rabbitmq-plugins enable --offline rabbitmq_web_stomp

run echo 'web_stomp.ws_frame = binary' >> /etc/rabbitmq/rabbitmq.conf

EXPOSE 15674
