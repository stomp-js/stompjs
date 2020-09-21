TEST = {
  destination: '/topic/chat.general',
  login: 'guest',
  password: 'guest',
  url: 'ws://localhost:15674/ws',
  badUrl: 'ws://localhost:61625',
  timeout: 2000,
  largeMessageSize: 1024, // 1MB body
};

Stomp = StompJs.Stomp;

// For ActiveMQ "ws://localhost:61614/stomp
