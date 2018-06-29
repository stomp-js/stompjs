# Broker Requirements

**Information on this page is outdated, please refer to your broker documentation
for up to date information.**

This library is not a _pure_ STOMP client. It is aimed to run on the 
WebSockets protocol which is not TCP. Basically, the WebSocket protocol 
requires a _handshake_ between the browser's client and the server to 
ensure the browser's "same-origin" security model remains in effect.

This means that this library can not connect to regular STOMP brokers 
since they would not understand the handshake initiated by the WebSocket 
which is not part of the STOMP protocol and would likely reject the 
connection.

There are ongoing works to add WebSocket support to STOMP broker so 
that they will accept STOMP connections over the WebSocket protocol.

## HornetQ

[HornetQ](http://jboss.org/hornetq) is the Open Source messaging system 
developed by Red Hat and JBoss.

To start HornetQ with support for STOMP Over WebSocket, 
[download the latest version](http://www.jboss.org/hornetq/downloads.html) 
and run the following steps:

```bash
  $ cd hornetq-x.y.z/examples/jms/stomp-websockets
  $ mvn clean install
  ...
  INFO: HQ221020: Started Netty Acceptor version 3.6.2.Final-c0d783c localhost:61614 for STOMP_WS protocol
  Apr 15, 2013 1:15:33 PM org.hornetq.core.server.impl.HornetQServerImpl$SharedStoreLiveActivation run
  INFO: HQ221007: Server is now live
  Apr 15, 2013 1:15:33 PM org.hornetq.core.server.impl.HornetQServerImpl start
  INFO: HQ221001: HornetQ Server version 2.3.0.CR2 (black'n'yellow2, 123) [c9e29e45-a5bd-11e2-976a-b3fef7ceb5df]
```

HornetQ is now started and listens to STOMP over WebSocket on the port `61614`.  
It accepts _WebSocket connections_ from the URL `ws://localhost:61614/stomp`

To configure and run HornetQ with STOMP Over WebSocket enabled, follow the 
[instructions](http://docs.jboss.org/hornetq/2.3.0.CR2/docs/user-manual/html/interoperability.html#stomp.websockets).

## ActiveMQ

[ActiveMQ](http://activemq.apache.org) is the Open Source messaging system 
developed by Apache. Starting with 5.4 snapshots, ActiveMQ supports STOMP 
Over WebSocket.

To configure and run ActiveMQ with STOMP Over WebSocket enabled, follow 
the [instructions](http://activemq.apache.org/websockets.html).

## ActiveMQ Apollo

[ActiveMQ Apollo](http://activemq.apache.org/apollo/) is the next generation 
of ActiveMQ broker. From the start, Apollo supports STOMP Over WebSocket.

To configure and run Apollo with STOMP Over WebSocket enabled, follow the 
[instructions](http://activemq.apache.org/apollo/documentation/user-manual.html#WebSocket_Transports).

## RabbitMQ

[RabbitMQ](http://www.rabbitmq.com/) is Open Source messaging system sponsored 
by Pivotal.

To configure and run RabbitMQ with STOMP Over WebSocket enabled, follow the 
instructions to install the 
[Web-Stomp plugin](http://www.rabbitmq.com/web-stomp.html).

## Stilts & Torquebox

[Stilts](http://stilts.projectodd.org/) is a STOMP-native messaging framework 
which aims to address treating STOMP as primary contract for messaging, and 
integrating around it, instead of simply applying STOMP shims to existing 
services.

[TorqueBox](http://torquebox.org/) uses the Stilts project to provide its 
[WebSockets and STOMP stack](http://torquebox.org/documentation/2.1.2/stomp.html).

