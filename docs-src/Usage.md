# Using STOMP JS

## The STOMP Broker

Ensure that your STOMP broker supports STOMP over WebSockets. Some messaging
brokers supports it out of the box while some may need special configuration 
or activating plugins.

## Include STOMP.js

### In Web Browser

* Download or directly include one of [CDN links] or from `bundles/` folder.
* `StompJs` object will now be available. Read along to learn how to use it.

#### Pollyfills

- [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
  It is not supported by IE (supported by Edge).
  It will need to be polyfilled from `npm` package `es6-object-assign`. A simple approach:
    ```html
    <script src="https://cdn.jsdelivr.net/npm/es6-object-assign@1.1.0/dist/object-assign-auto.min.js"></script>
    ```
- [TextEncoder](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder)
  and
  [TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder).
  These are not supported by any of the MicroSoft browsers as of 2018.
  These will need to be polyfilled from `npm` package `text-encoding`. A simple approach:
    ```html
    <script src="https://cdn.jsdelivr.net/npm/text-encoding@0.6.4/lib/encoding.min.js"></script>
    ```

### In NodeJS

* Add npm modules `@stomp/stompjs`, `websocket` and `text-encoding` to your project.
    ```bash
    $ npm install @stomp/stompjs websocket text-encoding
    ```

* Require the module
    ```javascript
        // This is simplest way to get going
        WebSocket = require('websocket').w3cwebsocket;
    
        // There is a proposal to add these by default in NodeJS, so good idea is to check first
        if (typeof TextEncoder !== 'function') {
          const TextEncodingPolyfill = require('text-encoding');
          TextEncoder = TextEncodingPolyfill.TextEncoder;
          TextDecoder = TextEncodingPolyfill.TextDecoder;
        }
      
        StompJs = require('@stomp/stompjs/esm5/');  
    ```
* Read along to learn how to use the `StompJs` object.

## Setting/getting options

All options can be set/get by directly operating on the client instance:

```javascript
    const client = new StompJs.Client();
    client.brokerURL = "ws://localhost:15674/ws";
    
    console.log(client.brokerURL);
```

These can also be set passing key/value pairs to [Client constructor](../classes/Client.html#constructor)
or to [Client#configure](../classes/Client.html#configure).

## Create a STOMP client

STOMP JavaScript clients will communicate to a STOMP server using a `ws://` or `wss://` URL.

```javascript
    const client = new StompJs.Client({
      brokerURL: "ws://localhost:15674/ws",
      connectHeaders: {
        login: "user",
        passcode: "password"
      },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
    
    client.onConnect = function(frame) {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
    };
    
    client.onStompError = function (frame) {
      // Will be invoked in case of error encountered at Broker
      // Bad login/passcode typically will cause an error
      // Complaint brokers will set `message` header with a brief message. Body may contain details.
      // Compliant brokers will terminate the connection after any error
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);
    };
    
    client.activate();
```

To deactivate a client call [Client#deactivate](../classes/Client.html#deactivate).
It will stop sttempting to reconnect and disconnect if there is an active connection.

```javascript
    client.deactivate();
```

## Send messages

When the client is connected to the server, it can send STOMP messages using
the [Client#publish](../classes/Client.html#publish) method.

```javascript
    client.publish({destination: '/topic/general', body: 'Hello world'});

    // There is an option to skip content length header
    client.publish({destination: '/topic/general', body: 'Hello world', skipContentLengthHeader: true});
    
    // Additional headers
    client.publish({destination: '/topic/general', body: 'Hello world', headers: {'priority': '9'}});
```

Starting version 5, sending binary messages is supported.
To send a binary message body use binaryBody parameter. It should be a
[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).

```javascript
    var binaryData = generateBinaryData(); // This need to be of type Uint8Array
    // setting content-type header is not mandatory, however a good practice
    client.publish({destination: '/topic/special', binaryBody: binaryData,
                    headers: {'content-type': 'application/octet-stream'}});
```

## Subscribe and receive messages

To receive messages in the browser, the STOMP client must first subscribe to 
a destination.

You can use the [Client#subscribe](../classes/Client.html#subscribe) method to subscribe to a destination. The method
takes 2 mandatory arguments: `destination`, a String corresponding to the 
destination and `callback`, a function with one message argument and an optional
argument `headers`, a JavaScript object for additional headers.

```javascript
  var subscription = client.subscribe("/queue/test", callback);
```

The subscribe() methods returns a JavaScript object with one attribute, `id`, 
that correspond to the client subscription ID and one method `unsubscribe()` 
that can be used later on to unsubscribe the client from this destination.

Every time the server sends 
a message to the client, the client will in turn invoke the callback with a 
[Message](../classes/Message.html) object.

```javascript
  callback = function(message) {
    // called when the client receives a STOMP message from the server
    if (message.body) {
      alert("got message with body " + message.body)
    } else {
      alert("got empty message");
    }
  };
```

The `subscribe()` method takes an optional headers argument to specify 
additional `headers` when subscribing to a destination:

```javascript
  var headers = {ack: 'client'};
  client.subscribe("/queue/test", message_callback, headers);
```

The client specifies that it will handle the message acknowledgement.

To stop receiving messages, the client can use the 
[unsubscribe](../interfaces/StompSubscription.html#unsubscribe) method on 
the object returned by the [Client#subscribe](../classes/Client.html#subscribe) method.

```javascript
  var subscription = client.subscribe("queue/test", onmessage);
 
  // ... use the subscription ...
  
  subscription.unsubscribe();
```
## Binary messages

### Prep your broker

Not every broker will support binary messages out of the box.
For example RabbitMQ (see: https://www.rabbitmq.com/web-stomp.html)
will need following to be added to the server configuration:

```
web_stomp.ws_frame = binary
```

### Publishing binary messages

Use parameter `binaryBody` of [Client#publish](../classes/Client.html#publish) to send binary data of type
[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).

See [Send messages](#send-messages) for an example.

### Receiving binary messages

The library does not try to guess whether the incoming data is text/binary.
When you access [Message#body](../classes/Frame.html#body) the message will be returned as string.
To access the message body as binary please call [Message#binaryBody](../classes/Frame.html#binaryBody).

There is no generally accepted convention in STOMP (actually messaging in general) to indicate that a message
is binary. The message senders and receivers will need to agree on required convention.

You may choose to set `content-type` header to indicate binary message.

```javascript
    // within message callback
    if (message.headers['content-type'] === 'application/octet-stream') {
      // message is binary
      // call message.binaryBody 
    } else {
      // message is text
      // call message.body
    }
```

## JSON support

The body of a STOMP message must be a String. If you want to send and receive
[JSON](http://json.org/) objects, you can use `JSON.stringify()` and 
`JSON.parse()` to transform the JSON object to a String and vice versa.

```javascript
  var quote = {symbol: 'APPL', value: 195.46};
  client.send("/topic/stocks", {}, JSON.stringify(quote));

  client.subcribe("/topic/stocks", function(message) {
    var quote = JSON.parse(message.body);
    alert(quote.symbol + " is at " + quote.value);
  });
```

## Acknowledgment

By default, STOMP messages will be automatically acknowledged by the server
before the message is delivered to the client.

The client can choose instead to handle message 
acknowledgement by subscribing 
to a destination and specify a `ack` header set to `client` or 
`client-individual`.

In that case, the client must use the [Message#ack](../classes/Message.html#ack) method to inform the 
server that it has processed the message.

```javascript
  var subscription = client.subscribe("/queue/test",
    function(message) {
      // do something with the message
      // ...
      // and acknowledge it
      message.ack();
    },
    {ack: 'client'}
  );
```

The [Message#ack](../classes/Message.html#ack) method accepts `headers` argument for additional headers.
For example, it is possible to acknowledge a 
message as part of a transaction and ask for a receipt when the `ACK` has effectively been processed by the broker:

```javascript
  var tx = client.begin();
  message.ack({ transaction: tx.id, receipt: 'my-receipt' });
  tx.commit();
```

The [Message#nack](../classes/Message.html#nack) method can also be used to inform STOMP 1.1 or higher
brokers that the client did not consume the message. It 
takes the same arguments than the [Message#ack](../classes/Message.html#ack) method.

## Transactions

Messages can be sent and acknowledged _in a transaction_.

A transaction is started by the client using its [Client#begin](../classes/Client.html#begin) method which 
takes an optional `transaction_id`.

This methods returns a JavaScript object with an `id` attribute corresponding
to the transaction ID and two methods:

* [Client#commit](../classes/Client.html#commit) to commit the transaction
* [Client#abort](../classes/Client.html#abort) to abort the transaction

The client can then send and/or acknowledge messages in the transaction
by specifying a `transaction` set with the transaction `id`.

```javascript
  // start the transaction
  var tx = client.begin();
  // send the message in a transaction
  client.publish({destination: "/queue/test", headers: {transaction: tx.id}, body: "message in a transaction"});
  // commit the transaction to effectively send the message
  tx.commit();
```

_If you forget to add the `transaction` header when calling [Client#publish](../classes/Client.html#publish) the message
will not be part of the transaction and will be sent directly without waiting
for the completion of the transaction._

```javascript
  // start the transaction
  var tx = client.begin();
  // oops! send the message outside the transaction
  client.publish({destination: "/queue/test", body: "message in a transaction"});
  tx.abort(); // Too late! the message has been sent
```

## Heart-beating

If the STOMP broker accepts STOMP 1.1 or higher frames, 
heart-beating is enabled by default.
Options [Client#heartbeatIncoming](../classes/Client.html#heartbeatIncoming)
and [Client#heartbeatOutgoing](../classes/Client.html#heartbeatOutgoing)
can be used to control heart-beating
(default value for both is 10,000ms). These can be disabled by setting to 0.

```javascript
    client.heartbeatOutgoing = 20000; // client will send heartbeats every 20000ms
    client.heartbeatIncoming = 0;     // client does not want to receive heartbeats
                                       // from the server
```

## Auto Reconnect

The `client` supports automatic reconnecting in case of a connection failure. It is
controlled by a option [Client#reconnectDelay](../classes/Client.html#reconnectDelay).
Default value is 5000ms, which indicates that
a attempt to connect will be made after 5000ms of a connection drop.

```javascript
  // Add the following if you need automatic reconnect (delay is in milli seconds)
  client.reconnectDelay = 300;
```

This can be set quite small.

## Debug

The client can set its [Client#debug](../classes/Client.html#debug) property to a function with takes a `String` 
argument to see all the debug statements of the library:

```javascript
  client.debug = function(str) {
    console.log(str);
  };
```

By default, the debug messages are ignored.
On a busy system the logs can be overwhelming.

## Callbacks

### Lifecycle callbacks

- [Client#beforeConnect](../classes/Client.html#beforeConnect) - invoked each time before 
  connection to STOMP broker is attempted. You can modify connection parameters and other callbacks.
- [Client#onConnect](../classes/Client.html#onConnect) - invoked for each time STOMP broker connects and
  STOMP handshake is complete
- [Client#onDisconnect](../classes/Client.html#onDisconnect) - invoked after each graceful disconnection.
  If the connection breaks because of an error or network failure, it will no tbe called.
- [Client#onStompError](../classes/Client.html#onStompError) - invoked when the broker reports an Error
- [Client#onWebSocketClose](../classes/Client.html#onWebSocketClose)  - when the WebSocket closes.
  It is most reliable way of knowing that the connection has terminated.

### Frame callbacks

- [Client#onUnhandledMessage](../classes/Client.html#onUnhandledMessage) - typically brokers will send messages
  corresponding to subscriptions. 
  However, brokers may support concepts that are beyond standard definition of STOMP -
  for example RabbitMQ support concepts of temporary queues.
  If any message is received that is not linked to a subscription, this callback will be invoked.
- [Client#onUnhandledReceipt](../classes/Client.html#onUnhandledReceipt) - you should prefer
  [Client#watchForReceipt](../classes/Client.html#watchForReceipt). If there is any incoming receipt for
  which there is no active watcher, this callback will be invoked.
- [Client#treatMessageAsBinary](../classes/Client.html#treatMessageAsBinary) - invoked for each incoming
  message, depending on the outcome, the body is returned as string or Uint8Array. The default implementation
  always returns `false`.
- [Client#onUnhandledFrame](../classes/Client.html#onUnhandledFrame) - it will be invoked if broker sends a
  non standard STOMP command.
  
## Advanced notes

The version 5 of this library has taken significant variation from previous syntax. This version allows
all of the options and callbacks to be altered.
New values will take effect as soon as possible. For example:

- Altered values of [Client#onUnhandledMessage](../classes/Client.html#onUnhandledMessage) 
  or [Client#onDisconnect](../classes/Client.html#onDisconnect) will be effective immediately.
- New values of [Client#heartbeatIncoming](../classes/Client.html#heartbeatIncoming)
  and [Client#heartbeatOutgoing](../classes/Client.html#heartbeatOutgoing) will be used next time STOMP connects.

The callback sequences are arranged in a way that most expected operations should work.
For example it is possible to call [Client#deactivate](../classes/Client.html#deactivate)
within [Client#onStompError](../classes/Client.html#onStompError)
or [Client#onWebSocketClose](../classes/Client.html#onWebSocketClose).
This is useful if we determine that we have incorrect credentials and no point keep on trying to connect.

The above also allows readjusting [Client#reconnectDelay](../classes/Client.html#reconnectDelay)
in [Client#onWebSocketClose](../classes/Client.html#onWebSocketClose).
This can be used to implement exponential back-off before each successive reconnect attempt.

Even [Client#brokerURL](../classes/Client.html#brokerURL)
or [Client#connectHeaders](../classes/Client.html#connectHeaders)
can be altered which would get used in a subsequent reconnect.
However, I will suggest creating a new instance of the STOMP client in this scenario.
