# Upgrade (Work in Progress)

## Auto Reconnect

Please note:

* After each connect (i.e., initial connect as well each reconnection) the connectCallback
  will be called.
* After reconnecting, it will not automatically subscribe to queues that were subscribed.
  So, if all subscriptions are part of the connectCallback (which it would in most of the cases),
  you will not need to do any additional handling.

### Stomp.client, Stomp.overTCP, or, Stomp.overWS

Just add `client.reconnect_delay = 5000;`. The delay is in milli seconds. A value
of `0` indicates auto reconnect is disabled.

```javascript
    var url = "ws://localhost:61614/stomp";
    var client = Stomp.client(url);
    
    // Add the following if you need automatic reconnect (delay is in milli seconds)
    client.reconnect_delay = 5000;
```

See also:

* [Auto Reconnect](Usage.md.html#toc_7)

### Stomp.over

If you were using Stomp.over like:

```javascript
    <script src="http://cdn.sockjs.org/sockjs-0.3.min.js"></script>
    <script>
        // use SockJS implementation instead of the browser's native implementation
        var ws = new SockJS(url);
        var client = Stomp.over(ws);
        // ...
    </script>
```

Change it to:

```javascript
    <script src="http://cdn.sockjs.org/sockjs-0.3.min.js"></script>
    <script>
        // use SockJS implementation instead of the browser's native implementation
        var client = Stomp.over(function(){
                                   return new SockJS(url);
                                });
    
        // Add the following if you need automatic reconnect (delay is in milli seconds)
        client.reconnect_delay = 5000;
        // ...
    </script>
```

See also:

* [Stomp.over](../../mixin/Stomp.html#over-)

## NodeJS

NodeJS now supports same semantics as the browser, so you might need to make changes
if you were using NodeJS specific syntax.

### Stomp.overWS -> Stomp.client

Just change the method name:

```javascript
    var client = Stomp.overWS("ws://localhost:61614/stomp");
```
 to
 
```javascript
    var client = Stomp.client("ws://localhost:61614/stomp");
```

* [Stomp.client](../../mixin/Stomp.html#client-)


### Stomp.overTCP -> Stomp.client

The older code to handle STOMP over TCP was not properly maintained. So, this library
drops support for using STOMP over raw TCP. If you need that functionality you may
need to use the original version of this library from:
https://github.com/jmesnil/stomp-websocket

To upgrade:

* Ensure that your STOMP broker is configured to communicate STOMP over
  WebSocket.
* Get the WebSocket endpoint URL - typically like `ws://localhost:61614/stomp`

```javascript
    var client = Stomp.overTCP("localhost", 61613);
```
 to
 
```javascript
    var client = Stomp.client("ws://localhost:61614/stomp");
```

Do test your application.

See also:

* [Stomp.client](../../mixin/Stomp.html#client-)

## SockJS -> WebSocket

Summary of steps:

* Ensure that your STOMP broker is configured to communicate STOMP over
  WebSocket.
* SockJS and WebSocket use different handshake mechanism, so, their end points
  are likely to be different.
* Get the WebSocket endpoint URL - typically like `ws://localhost:61614/stomp`
* Replace your code to create `Client` similar to:

```javascript
    var client = Stomp.client("ws://localhost:61614/stomp");
```

See also:

* [SockJS Limitations](sockjs.md.html)
* [Stomp.over](../../mixin/Stomp.html#over-)
* [Stomp.client](../../mixin/Stomp.html#client-)


