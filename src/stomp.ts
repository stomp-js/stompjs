import {Client} from "./client";

/**
 * STOMP Class, acts like a factory to create {@link Client}.
 */
export class Stomp {
  /**
   * @internal
   */
  public static VERSIONS = {
    V1_0: '1.0',
    V1_1: '1.1',
    V1_2: '1.2',

    /**
     * Versions of STOMP specifications supported
     *
     * @internal
     */
    supportedVersions: function () {
      return '1.2,1.1,1.0';
    }
  };

  /**
   * In case you need to use a non standard class for WebSocket.
   *
   * For example when using within NodeJS environment:
   *
   * ```javascript
   *        StompJs = require('../../esm5/');
   *        Stomp = StompJs.Stomp;
   *        Stomp.WebSocketClass = require('websocket').w3cwebsocket;
   * ```
   */
  public static WebSocketClass:any = null;

  /**
   * This method creates a WebSocket client that is connected to
   * the STOMP server located at the url.
   *
   * ```javascript
   *        var url = "ws://localhost:61614/stomp";
   *        var client = Stomp.client(url);
   * ```
   */
  public static client (url: string, protocols: string[]): Client {
    // This is a hack to allow another implementation than the standard
    // HTML5 WebSocket class.
    //
    // It is possible to use another class by calling
    //
    //     Stomp.WebSocketClass = MozWebSocket
    //
    // *prior* to call `Stomp.client()`.
    //
    // This hack is deprecated and `Stomp.over()` method should be used
    // instead.

    // See remarks on the function Stomp.over
    if (protocols == null) { protocols = ['v10.stomp', 'v11.stomp', 'v12.stomp']; }
    const ws_fn= function() {
      const klass = Stomp.WebSocketClass || WebSocket;
      return new klass(url, protocols);
    };

    return new Client(ws_fn);
  }

  /**
   * This method is an alternative to [Stomp#client]{@link Stomp#client} to let the user
   * specify the WebSocket to use (either a standard HTML5 WebSocket or
   * a similar object).
   *
   * In order to support reconnection, the function Client._connect should be callable more than once. While reconnecting
   * a new instance of underlying transport (TCP Socket, WebSocket or SockJS) will be needed. So, this function
   * alternatively allows passing a function that should return a new instance of the underlying socket.
   *
   * ```javascript
   *        var client = Stomp.over(function(){
   *          return new WebSocket('ws://localhost:15674/ws')
   *        });
   * ```
   */
  public static over (ws: any): Client {
    const ws_fn = typeof(ws) === "function" ? ws : () => ws;

    return new Client(ws_fn);
  }

  /**
   * @internal
   */
  public static setInterval(interval: number, f: Function) {
    setInterval(f, interval);
  }

  /**
   * @internal
   */
  public static clearInterval(id: number) {
    clearInterval(id)
  };
}
