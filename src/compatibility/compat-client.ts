import {Client} from "../client";
import {StompHeaders} from "../stomp-headers";
import {frameCallbackType, messageCallbackType} from "../types";

/**
 * Available for backward compatibility, please shift to using {@link Client}.
 *
 * **Deprecated**
 */
export class CompatClient extends Client {

  /**
   * Available for backward compatibility, please shift to using {@link Client}
   * and [Client#webSocketFactory]{@link Client#webSocketFactory}.
   *
   * **Deprecated**
   */
  constructor(webSocketFactory: () => any) {
    super();
    this.reconnect_delay = 0;
    this.webSocketFactory = webSocketFactory;
    // Default from previous version
    this.debug = (...message: any[]) => {
      console.log(...message);
    };
  }

  private _parseConnect(...args: any[]): any {
    let closeEventCallback, connectCallback, errorCallback;
    let headers: StompHeaders = {};
    if (args.length < 2) {
      throw("Connect requires at least 2 arguments");
    }
    if (typeof(args[1]) === 'function') {
      [headers, connectCallback, errorCallback, closeEventCallback] = args;
    } else {
      switch (args.length) {
        case 6:
          [headers['login'], headers['passcode'], connectCallback, errorCallback, closeEventCallback, headers['host']] = args;
          break;
        default:
          [headers['login'], headers['passcode'], connectCallback, errorCallback, closeEventCallback] = args;
      }
    }

    return [headers, connectCallback, errorCallback, closeEventCallback];
  }

  /**
   * Available for backward compatibility, please shift to using [Client#activate]{@link Client#activate}.
   *
   * **Deprecated**
   *
   * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
   * version with headers to pass your broker specific options.
   *
   * overloads:
   * - connect(headers, connectCallback)
   * - connect(headers, connectCallback, errorCallback)
   * - connect(login, passcode, connectCallback)
   * - connect(login, passcode, connectCallback, errorCallback)
   * - connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
   * - connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
   *
   * params:
   * - headers, see [Client#connectHeaders]{@link Client#connectHeaders}
   * - connectCallback, see [Client#onConnect]{@link Client#onConnect}
   * - errorCallback, see [Client#onStompError]{@link Client#onStompError}
   * - closeEventCallback, see [Client#onWebSocketClose]{@link Client#onWebSocketClose}
   * - login [String]
   * - passcode [String]
   * - host [String] Optional, virtual host to connect to. STOMP 1.2 makes it mandatory,
   *                 however the broker may not mandate it
   *
   * ```javascript
   *        client.connect('guest, 'guest', function(frame) {
   *          client.debug("connected to Stomp");
   *          client.subscribe(destination, function(message) {
   *            $("#messages").append("<p>" + message.body + "</p>\n");
   *          });
   *        });
   * ```
   *
   * Note: When auto reconnect is active, `connectCallback` and `errorCallback` will be called on each connect or error
   *
   * See also: [CONNECT Frame]{@link http://stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame}
   */
  public connect(...args: any[]): void {
    const out = this._parseConnect(...args);

    if (out[0]) { this.connectHeaders = out[0]; }
    if (out[1]) { this.onConnect = out[1]; }
    if (out[2]) { this.onStompError = out[2]; }
    if (out[3]) { this.onWebSocketClose = out[3]; }

    super.activate();
  }

  /**
   * Available for backward compatibility, please shift to using [Client#activate]{@link Client#activate}.
   *
   * **Deprecated**
   *
   * See:
   * [Client#onDisconnect]{@link Client#onDisconnect}, and
   * [Client#disconnectHeaders]{@link Client#disconnectHeaders}
   */
  public disconnect(disconnectCallback?: any, headers: StompHeaders = {}): void {
    if (disconnectCallback) {
      this.onDisconnect = disconnectCallback;
    }
    this.disconnectHeaders = headers;

    super.deactivate();
  }

  /**
   * Available for backward compatibility, renamed to [Client#reconnectDelay]{@link Client#reconnectDelay}.
   *
   * **Deprecated**
   */
  set reconnect_delay(value: number) {
    this.reconnectDelay = value;
  }

  /**
   * Available for backward compatibility, renamed to [Client#webSocket]{@link Client#webSocket}.
   *
   * **Deprecated**
   */
  get ws(): any {
    return this._webSocket;
  }

  /**
   * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
   *
   * **Deprecated**
   */
  get onreceive(): messageCallbackType {
    return this.onUnhandledMessage;
  }

  /**
   * Available for backward compatibility, renamed to [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
   *
   * **Deprecated**
   */
  set onreceive(value: messageCallbackType) {
    this.onUnhandledMessage = value;
  }

  /**
   * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
   * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}.
   *
   * **Deprecated**
   */
  get onreceipt(): frameCallbackType {
    return this.onUnhandledReceipt;
  }

  /**
   * Available for backward compatibility, renamed to [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
   *
   * **Deprecated**
   */
  set onreceipt(value: frameCallbackType) {
    this.onUnhandledReceipt = value;
  }

  private _heartbeatInfo: HeartbeatInfo = new HeartbeatInfo(this);

  /**
   * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
   * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
   *
   * **Deprecated**
   */
  get heartbeat() {
    return this._heartbeatInfo;
  }

  /**
   * Available for backward compatibility, renamed to [Client#heartbeatIncoming]{@link Client#heartbeatIncoming}
   * [Client#heartbeatOutgoing]{@link Client#heartbeatOutgoing}.
   *
   * **Deprecated**
   */
  set heartbeat(value: {incoming: number, outgoing: number}) {
    this.heartbeatIncoming = value.incoming;
    this.heartbeatOutgoing = value.outgoing;
  }
}

/**
 * @internal
 */
class HeartbeatInfo {
  constructor (private client: CompatClient) {
  }

  get outgoing(): number {
    return this.client.heartbeatOutgoing;
  }

  set outgoing(value: number) {
    this.client.heartbeatOutgoing = value;
  }

  get incoming(): number {
    return this.client.heartbeatIncoming;
  }

  set incoming(value: number) {
    this.client.heartbeatIncoming = value;
  }
}