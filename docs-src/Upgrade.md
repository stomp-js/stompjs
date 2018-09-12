# Upgrade (Work in Progress)

## Upgrading from version 3/4

This version uses newer Javascript features. Few these can be pollyfilled in older
browsers.
However [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
is critically needed and not possible to be efficiently pollyfilled  (notably in IE9 or lower).
If you need to support any browser that does not have native support for Uint8Array
please continue using version 4 of this library.

### Basic changes

Please follow section [Include STOMP.js](usage.html#include-stomp-js) to add latest version
and to include necessary polyfills.

The following is for convenience - to keep the code change to the minimum.

```javascript
    // Depending on your JS version you may have to use var instead of const 
     
    // To use compatibility mode
    const Stomp = StompJs.Stomp;
```

### For the lazy: use the compatibility mode

With the changes above, your code should now work. If you face issues please
raise an issue at https://github.com/stomp-js/stompjs/issues

*Note: no new features will be added to the compatibility mode.
Attempt would be made so that code working in version 3/4 continue
to work. The compatibility mode will be maintained for a year.*


### Take control: proper upgrade

This section covers rationale of new features and 
changes needed to take full advantage.

#### Creating a client and connecting

In version 3/4 typically a client instance is created and one of the
variants of connect is called.
Over the years connect has gotten many variants with different
combination of parameters.

The new version makes all options settable on client instance.
These options can be passed during creation of a client or while
calling [client.activate](https://stomp-js.github.io/stompjs/classes/Client.html#activate).

**Old**

```javascript
    const client = Stomp.client("ws://localhost:15674/ws");
    
    client.debug =  function (str) {
      console.log(str);
    };
    
    client.heartbeat.incoming = 4000;
    client.heartbeat.outgoing = 4000;
    
    client.reconnect_delay = 5000;
    
    client.connect("user", "password",
      function () {
        // Do something
      });
```

**Updated**

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
    // Do something
    };
    
    client.activate();
```

Please see [StompConfig](../interfaces/StompConfig.html) for all possible options.
These options can be set onto [client](../classes/Client.html).
Alternatively these can be passed
as options to the [Client constructor](../classes/Client.html#constructor) constructor,
the [Client#activate](../classes/Client.html#activate)
or the [Client#deactivate](../classes/Client.html#deactivate) calls.
If you want to set options in bulk you can use [Client#configure](../classes/Client.html#configure).

#### Publishing messages

**Old**

```javascript
    client.send('/topic/general', {}, 'Hello world');

    // Skip content length header
    client.send('/topic/general', {'content-length': false}, 'Hello world');
 
    // Additional headers
    client.send('/topic/general', {'priority': '9'}, 'Hello world');
```

**Updated**

```javascript
    client.publish({destination: '/topic/general', body: 'Hello world'});

    // There is an option to skip content length header
    client.publish({destination: '/topic/general', body: 'Hello world', skipContentLengthHeader: true});
    
    // Additional headers
    client.publish({destination: '/topic/general', body: 'Hello world', headers: {'priority': '9'}});
```

#### Semantic changes

- [Stomp.client](../classes/Stomp.html#client) --> [Client constructor](../classes/Client.html#constructor)
  and [Client#brokerURL](../classes/Client.html#brokerURL)
- [Stomp.over](../classes/Stomp.html#over) --> [Client constructor](../classes/Client.html#constructor)
  and [Client#webSocketFactory](../classes/Client.html#webSocketFactory)
- [connect](../classes/CompatClient.html#connect) --> [Client#activate](../classes/Client.html#activate)
    - login, passcode, host --> [Client#connectHeaders](../classes/Client.html#connectHeaders)
    - connectCallback --> [Client#onConnect](../classes/Client.html#onConnect) 
    - errorCallback --> [Client#onStompError](../classes/Client.html#onStompError)
    - closeEventCallback --> [Client#onWebSocketClose](../classes/Client.html#onWebSocketClose) 
- [disconnect](../classes/CompatClient.html#disconnect) --> [Client#deactivate](../classes/Client.html#deactivate)
    - disconnectCallback --> [Client#onDisconnect](../classes/Client.html#onDisconnect)
- [send](../classes/CompatClient.html#send) --> [Client#publish](../classes/Client.html#publish)

#### Name changes

These changes have been carried out in order to make a consistent naming convention (lowerCamelCase)
and to make meaning of the option clearer.

- [reconnect_delay](../classes/CompatClient.html#reconnect_delay) --> [Client#reconnectDelay](../classes/Client.html#reconnectDelay)
- [ws](../classes/CompatClient.html#ws) --> [Client#webSocket](../classes/Client.html#webSocket)
- [onreceive](../classes/CompatClient.html#onreceive) --> [Client#onUnhandledMessage](../classes/Client.html#onUnhandledMessage)
- [onreceipt](../classes/CompatClient.html#onreceipt) --> [Client#onUnhandledReceipt](../classes/Client.html#onUnhandledReceipt)
- [heartbeat](../classes/CompatClient.html#heartbeat).incoming --> [Client#heartbeatIncoming](../classes/Client.html#heartbeatIncoming)
- [heartbeat](../classes/CompatClient.html#heartbeat).outgoing --> [Client#heartbeatOutgoing](../classes/Client.html#heartbeatOutgoing)

#### Dropped APIs

- Client.html#maxWebSocketFrameSize [TODO]

## Migrating from Version 2

You will need to follow the instructions above with few additional considerations.

Please note:

* Auto reconnect is switched on by default.
  Set [Client#reconnectDelay](../classes/Client.html#reconnectDelay) to `0` to disable.
* After each connect (i.e., initial connect as well each reconnection) the 
  [Client#onConnect](../classes/Client.html#onConnect) (connectCallback in earlier versions)
  will be called.
* After reconnecting, it will not automatically subscribe to queues that were subscribed.
  So, if all subscriptions are part of the 
  [Client#onConnect](../classes/Client.html#onConnect) (which it would in most of the cases),
  you will not need to do any additional handling.

Additional notes:

- `Stomp.overWS` is same as `Stomp.client`. Follow the instructions for `Stomp.client` above.
- `NodeJS` is supported at same level as browser. Test suits are executed for both NodJS and browser.
  Follow the instructions as above.
- `Stomp.overTCP` is no longer supported. If your brokers supports WebStomp (STOMP over WebSocket),
  you may switch to that.
- If you are using `SockJS` please also see [SockJS support](../sockjs.html)
