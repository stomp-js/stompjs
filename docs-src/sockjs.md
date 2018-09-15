# In the Web browser with a custom WebSocket

As of 2018, WebSocket support in browsers is nearly ubiquitous.
Please check https://caniuse.com/#feat=websockets.
Depending on your user base you can skip this page.

You can use [SockJS](https://github.com/sockjs/sockjs-client)
to support browsers that do not natively support WebSockets.

You would need to consider the following:

- URL protocol conventions are different for WebSockets (`ws:`/`wss:`) and SockJS (`http:` or `https:`).
- Internal handshake sequences are different - so, some brokers will use different end points for
  both protocols.
- Neither of these allow custom headers to be set during the HTTP handshake.
- SockJS internally supports different transport mechanisms. You might face specific limitations
  depending on actual transport in use.
- Auto reconnect is not quite reliable with SockJS.
- Heartbeats may not be supported over SockJS by some brokers. 

It is advised to use WebSockets by default and then fall back to SockJS.


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
    
    // Fallback code
    if (typeof WebSocket !== 'function') {
      // For SockJS you need to set a factory that creates a new SockJS instance
      // to be used for each (re)connect
      client.webSocketFactory = function () {
        // Note that the URL is different from the WebSocket URL 
        return new SockJS("http://localhost:15674/stomp");
      };
    }

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

Compare the above against the sample in [../usage.html], only addition is the fallback code trying to
use SockJS if WebSocket is unavailable.
You will need to include latest https://github.com/sockjs/sockjs-client in your web page.
