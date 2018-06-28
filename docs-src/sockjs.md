# In the Web browser with a custom WebSocket

_Almost all brokers that support SockJS also support WebSockets. If your
application does not need to support old browsers, switch to using
WebSockets. Check https://en.wikipedia.org/wiki/WebSocket for compatibility 
information._

Web browsers supports different versions of the WebSocket protocol. Some 
older browsers does not provide the WebSocket JavaScript or expose it 
under another name. By default, `stomp.js` will use the Web browser native 
`WebSocket` class to create the WebSocket.

However it is possible to use other type of WebSockets by using the 
`Stomp.over(ws)` method. This method expects an object that conforms 
to the WebSocket definition.

For example, it is possible to use the implementation provided by the 
[SockJS](https://github.com/sockjs/sockjs-client) project which falls 
back to a variety of browser-specific transport protocols instead:

```javascript
    // use SockJS implementation instead of the browser's native implementation
    var client = Stomp.over(function(){
        return new SockJS(url);
    });
```
    
Use `Stomp.client(url)` to use regular WebSockets or use `Stomp.over(ws_fn)` 
if you required another type of WebSocket.

Apart from this initialization, the STOMP API remains the same in both cases.

## Limitations of SockJS

* SockJS is an emulation of WebSockets. This is not a complete implementation.
* Heart beating is not supported.
* SockJS internally uses one of many possible means to communicate. In some of
  those, auto reconnect may occasionally fail.
  

