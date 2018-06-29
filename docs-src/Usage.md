# Using STOMP JS

## The STOMP Broker

Ensure that your STOMP broker supports STOMP over WebSockets. Some messaging
brokers supports it out of the box while some may need special configuration 
or activating plugins. See [STOMP Brokers](./STOMP-brokers.md) for a non
authoritative list.

## Include STOMP.js

### In Web Browser

* Download [stomp.js](https://raw.githubusercontent.com/stomp-js/stomp-websocket/master/lib/stomp.js)
or [stomp.min.js](https://raw.githubusercontent.com/stomp-js/stomp-websocket/master/lib/stomp.min.js)
* Include in your web page.
* `Stomp` object will now be available. Read along to learn how to use it.

### In NodeJS

* Add npm modules `@stomp/stompjs` and `websocket` to your project.
  * using `npm`
    ```bash
    $ npm install @stomp/stompjs websocket --save
    ```
  * using `yarn`
    ```bash
    $ yarn add @stomp/stompjs websocket
    ```

* Require the module

    ```javascript
    var Stomp = require('@stomp/stompjs');
    ```
* Read along to learn how to use the `Stomp` object.


## Create a STOMP client

STOMP JavaScript clients will communicate to a STOMP server using a `ws://` URL.

To create a STOMP client JavaScript object, you need to call `Stomp.client(url)`
 with the URL corresponding to the server's WebSocket endpoint:

```javascript
  var url = "ws://localhost:15674/ws";
  var client = Stomp.client(url);
```
  
The Stomp.client(url, protocols) can also be used to override the 
default subprotocols provided by the library: 
['v10.stomp', 'v11.stomp', 'v12.stomp'] (for STOMP 1.0, 1.1, & 1.2 
specifications). This second argument can either be a single string
 or an array of strings to specify multiple subprotocols.
 
**Notes:** 

* In older versions of this library creating the client NodeJS was different.
If you need the old behavior please use version 3.x.x of the library.
* Recent versions of all web browsers and nodejs support WebSocket. However
if you need to support older browsers, please see [SockJS Support](sockjs.md.html).

## Connection to the server

Once a STOMP client is created, it must call its `connect()` method to 
effectively connect and authenticate to the STOMP server. Usually the STOMP
 borker needs
 two arguments, `login` and `passcode` corresponding to the user
  credentials. As per STOMP 1.2 `host` is mandatory, however many
  STOMP brokers do not insist on this.
  
Behind the scene, the client will open a connection using a WebSocket and send a
 [CONNECT](http://stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame)
frame.

The connection is done asynchronously: you have no guarantee to be effectively
connected when the call to `connect` returns. To be notified of the connection, 
you need to pass a `connect_callback` function to the `connect()` method:

```javascript
  var connect_callback = function() {
    // called back after the client is connected and authenticated to the STOMP server
  };
```

But what happens if the connection fails? the `connect()` method accepts an
  optional `error_callback` argument which will be called if the client is not able
  to connect to the server.
  The callback will be called with a single argument, an error object 
  corresponding to STOMP
  [ERROR](http://stomp.github.com/stomp-specification-1.2.html#ERROR) frame:
  
```javascript
  var error_callback = function(error) {
    // display the error's message header:
    alert(error.headers.message);
  };
```

The `connect()` method accepts different number of arguments to provide a simple 
API to use in most cases:

```javascript
  client.connect(login, passcode, connectCallback);
  client.connect(login, passcode, connectCallback, errorCallback);
  client.connect(login, passcode, connectCallback, errorCallback, closeEventCallback);
  client.connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host);
```

where `login`, `passcode` and `host` are strings. `connectCallback` and
`errorCallback` is a function which will receive a `Frame` as argument and 
`closeEventCallback` is a function which will receive a [CloseEvent](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent)

The `connect()` method also accepts two other variants if you need
 to pass additional headers:
 
```javascript
  client.connect(headers, connectCallback);
  client.connect(headers, connectCallback, errorCallback);
  client.connect(headers, connectCallback, errorCallback, closeEventCallback);
```

where `header` is a `map`. `connectCallback` and
`errorCallback` is a function which will receive a `Frame` as argument and 
`closeEventCallback` is a function which will receive a [CloseEvent](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent)


Please note that if you use these forms, you will typically add `login`,
 `passcode` (and `host`) headers yourself:

```javascript
    var headers = {
      login: 'mylogin',
      passcode: 'mypasscode',
      // additional header
      'client-id': 'my-client-id'
    };
    client.connect(headers, connectCallback);
```

To disconnect a client from the server, you can call its `disconnect()`
 method. The disconnection is asynchronous: to be notified when 
 the disconnection is effective, the `disconnect` method takes an 
 optional `callback` argument.

```javascript
  client.disconnect(function() {
    alert("See you next time!");
  });
```

When a client is disconnected, it can no longer send or receive messages.

## Heart-beating

If the STOMP broker accepts STOMP 1.1 or higher frames, 
heart-beating is enabled by default.

The `client` object has a `heartbeat` field which can be used to configure 
heart-beating by changing its incoming and outgoing integer fields 
(default value for both is 10,000ms). These can be disabled by setting to 0.

```javascript
    client.heartbeat.outgoing = 20000; // client will send heartbeats every 20000ms
    client.heartbeat.incoming = 0;     // client does not want to receive heartbeats
                                       // from the server
```

## Auto Reconnect

The `client` supports automatic reconnecting in case of a connection failure. It is
controlled by a field `reconnect_delay`. Default value is 0, which indicates auto
reconnect is disabled.

```javascript
  // Add the following if you need automatic reconnect (delay is in milli seconds)
  client.reconnect_delay = 5000;
```

## Send messages

When the client is connected to the server, it can send STOMP messages using
  the `send()` method. The method takes a mandatory `destination`
  argument corresponding to the STOMP destination. It also takes two optional
  arguments: `headers`, a JavaScript object containing additional
  message headers and `body`, a String.

```javascript
  client.send("/queue/test", {priority: 9}, "Hello, STOMP");
```

The client will send a STOMP 
[SEND](http://stomp.github.com/stomp-specification-1.2.html#SEND)
frame to `/queue/test` destination with a header `priority` set to `9` and
 a body `Hello, STOMP`.

If you want to send a message with a `body`, you must also pass the `headers`
 argument. If you have no `headers` to pass, use an empty JavaScript literal `{}`:

```javascript
  client.send(destination, {}, body);
```

## Subscribe and receive messages

To receive messages in the browser, the STOMP client must first subscribe to 
a destination.

You can use the `subscribe()` method to subscribe to a destination. The method
takes 2 mandatory arguments: `destination`, a String corresponding to the 
destination and `callback`, a function with one message argument and an optional
argument `headers`, a JavaScript object for additional headers.

```javascript
  var subscription = client.subscribe("/queue/test", callback);
```

The subscribe() methods returns a JavaScript object with one attribute, `id`, 
that correspond to the client subscription ID and one method `unsubscribe()` 
that can be used later on to unsubscribe the client from this destination.

By default, the library will generate an unique ID if there is none provided
in the headers. To use your own ID, pass it using the headers argument:

```javascript
  var mysubid = 'my-subscription-id-001';
  var subscription = client.subscribe(destination, callback, { id: mysubid });
```

The client will send a STOMP 
[SUBSCRIBE](http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE) 
frame to the server and register the callback. Every time the server sends 
a message to the client, the client will in turn call the callback with a 
STOMP `Frame` object corresponding to the message:

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
  var headers = {ack: 'client', 'selector': "location = 'Europe'"};
  client.subscribe("/queue/test", message_callback, headers);
```

The client specifies that it will handle the message acknowledgement and 
is interested to receive only messages matching the selector location = 'Europe'.


If you want to subscribe the client to multiple destinations, you can use
the same callback to receive all the messages:

```javascript
  onmessage = function(message) {
    // called every time the client receives a message
  };
  
  var sub1 = client.subscribe("queue/test", onmessage);
  var sub2 = client.subscribe("queue/another", onmessage);
```

To stop receiving messages, the client can use the `unsubscribe()` method on 
the object returned by the `subscribe()` method.

```javascript
  var subscription = client.subscribe("queue/test", onmessage);
 
  // ... use the subscription ...
  
  subscription.unsubscribe();
```

JSON support

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
[acknowledgement](http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE_ack_Header) by subscribing 
to a destination and specify a `ack` header set to `client` or 
`client-individual`.

In that case, the client must use the `message.ack()` method to inform the 
server that it has acknowledge the message. This method sends an 
[ACK](http://stomp.github.io/stomp-specification-1.2.html#ACK) Frame to the
broker.

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

The `ack()` method accepts a `headers` argument for additional headers to 
acknowledge the message. For example, it is possible to acknowledge a 
message as part of a transaction and ask for a receipt when the `ACK` STOMP 
frame has effectively be processed by the broker:

```javascript
  var tx = client.begin();
  message.ack({ transaction: tx.id, receipt: 'my-receipt' });
  tx.commit();
```

The `message.nack()` method can also be used to inform STOMP 1.1 or higher
brokers that the client did not consume the message using a
[NACK](http://stomp.github.io/stomp-specification-1.2.html#NACK) Frame. It 
takes the same arguments than the `ack()` method.

## Transactions

Messages can be sent and acknowledged _in a transaction_.

A transaction is started by the client using its `begin()` method which 
takes an optional `transaction_id`, a String which uniquely identifies the 
transaction. If no `transaction_id` is passed, the library will generate 
one automatically.

This methods returns a JavaScript object with an `id` attribute corresponding
to the transaction ID and two methods:

* `commit()` to commit the transaction
* `abort()` to abort the transaction

The client can then send and/or acknowledge messages in the transaction
by specifying a `transaction` set with the transaction `id`.

```javascript
  // start the transaction
  var tx = client.begin();
  // send the message in a transaction
  client.send("/queue/test", {transaction: tx.id}, "message in a transaction");
  // commit the transaction to effectively send the message
  tx.commit();
```

_If you forget to add the `transaction` header when calling `send()` the message
will not be part of the transaction and will be sent directly without waiting
for the completion of the transaction._

```javascript
  var txid = "unique_transaction_identifier";
  // start the transaction
  var tx = client.begin();
  // oops! send the message outside the transaction
  client.send("/queue/test", {}, "I thought I was in a transaction!");
  tx.abort(); // Too late! the message has been sent
```

## Debug

There are few tests in the code and it is helpful to see what is sent and 
received from the library to debug application.

The client can set its `debug` property to a function with takes a `String` 
argument to see all the debug statements of the library:

```javascript
  client.debug = function(str) {
    // append the debug log to a #debug div somewhere in the page using JQuery:
    $("#debug").append(str + "\n");
  };
```

By default, the debug messages are logged in the browser window's console.

On a busy system the logs can be overwhelming, to disable logging, set it to
an empty function:

```javascript
  client.debug = function(str) {};
```