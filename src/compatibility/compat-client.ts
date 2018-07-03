import {Client} from "../client";
import {StompHeaders} from "../stomp-headers";
import {frameCallbackType, messageCallbackType} from "../types";

export class CompatClient extends Client {

  constructor(webSocketFactory: () => any) {
    super();
    this.webSocketFactory = webSocketFactory;
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
   * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
   * version with headers to pass your broker specific options.
   *
   * @overload connect(headers, connectCallback)
   *
   * @overload connect(headers, connectCallback, errorCallback)
   *
   * @overload connect(login, passcode, connectCallback)
   *
   * @overload connect(login, passcode, connectCallback, errorCallback)
   *
   * @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
   *
   * @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
   *
   * @param headers [Object]
   * @option headers [String] login
   * @option headers [String] passcode
   * @option headers [String] host virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
   * @param connectCallback [function(Frame)] Called upon a successful connect or reconnect
   * @param errorCallback [function(any)] Optional, called upon an error. The passed paramer may be a {Frame} or a message
   * @param closeEventCallback [function(CloseEvent)] Optional, called when the websocket is closed.
   *
   * @param login [String]
   * @param passcode [String]
   * @param host [String] Optional, virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
   *
   * @example
   *        client.connect('guest, 'guest', function(frame) {
   *          client.debug("connected to Stomp");
   *          client.subscribe(destination, function(message) {
   *            $("#messages").append("<p>" + message.body + "</p>\n");
   *          });
   *        });
   *
   * @note When auto reconnect is active, `connectCallback` and `errorCallback` will be called on each connect or error
   *
   * @see http:*stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame CONNECT Frame
   */
  public connect(...args: any[]): void {
    const out = this._parseConnect(...args);
    [this.connectHeaders, this.onConnect, this.onStompError, this.onWebSocketClose] = out;

    super.connect();
  }

  public disconnect(disconnectCallback?: any, headers: StompHeaders = {}): void {
    if (disconnectCallback) {
      this.onDisconnect = disconnectCallback;
    }
    this.disconnectHeaders = headers;

    super.disconnect();
  }

  set reconnect_delay(value: number) {
    this.reconnectDelay = value;
  }

  get ws(): any {
    return this._webSocket;
  }

  get onreceive(): messageCallbackType {
    return this.onUnhandledMessage;
  }

  set onreceive(value: messageCallbackType) {
    this.onUnhandledMessage = value;
  }

  get onreceipt(): frameCallbackType {
    return this.onReceipt;
  }

  set onreceipt(value: frameCallbackType) {
    this.onReceipt = value;
  }

  private _heartbeatInfo: HeartbeatInfo = new HeartbeatInfo(this);

  get heartbeat() {
    return this._heartbeatInfo;
  }

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