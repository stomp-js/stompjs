import {StompHeaders} from "./stomp-headers";
import {Message} from "./message";
import {StompSubscription} from "./stomp-subscription";
import {Transaction} from "./transaction";
import {closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType} from "./types";
import {StompConfig} from './stomp-config';
import {StompHandler} from "./stomp-handler";

/**
 * STOMP Client Class.
 */
export class Client {
  /**
   * This function should return a WebSocket or a similar (e.g. SockJS) object.
   */
  public webSocketFactory: () => any;

  /**
   *  automatically reconnect with delay in milliseconds, set to 0 to disable
   */
  public reconnectDelay: number = 5000;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable
   */
  public heartbeatIncoming: number = 10000;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable
   */
  public heartbeatOutgoing: number = 10000;

  // public heartbeat: { outgoing: number; incoming: number };

  /**
   * Maximum WebSocket frame size sent by the client. If the STOMP frame
   * is bigger than this value, the STOMP frame will be sent using multiple
   * WebSocket frames (default is 16KiB)
   */
  public maxWebSocketFrameSize: number = 16 * 1024;

  /**
   * Underlying WebSocket instance, READONLY
   */
  get webSocket(): WebSocket {
    return this._webSocket;
  }
  /**
   * Underlying WebSocket instance
   * @internal
   */
  protected _webSocket: WebSocket;

  /**
   * Connection headers, important keys - `login`, `passcode`, `host`
   */
  public connectHeaders: StompHeaders;

  /**
   * Disconnection headers
   */
  public disconnectHeaders: StompHeaders;

  /**
   * This function will be called for any unhandled messages. It is useful to receive messages sent to
   * temporary queues (for example RabbitMQ supports such queues).
   *
   * It can also be called for stray messages while the server is processing a request to unsubcribe
   * from an endpoint.
   */
  public onUnhandledMessage: messageCallbackType;

  /**
   * STOMP brokers can be requested to notify when an operation is actually completed.
   *
   * TODO: add example
   */
  public onReceipt: frameCallbackType;

  /**
   * `true` if there is a active connection with STOMP Broker
   */
  get connected(): boolean {
    return (!!this._stompHandler) && this._stompHandler.connected;
  }

  /**
   * Callback, invoked on every successful connection to the STOMP broker.
   *
   * The actual frame is passed as parameter to the callback.
   */
  public onConnect: frameCallbackType;

  /**
   * Callback, invoked on every successful disconnection from the STOMP broker. It will not be invoked if
   * the STOMP broker disconnected due to an error.
   *
   * The actual frame is passed as parameter to the callback.
   *
   * The way STOMP protocol is designed, the connection may close/terminate without the client
   * receiving the DISCONNECT frame.
   * You might find [Client#onWebSocketClose]{@link Client#onWebSocketClose} more appropriate.
   */
  public onDisconnect: frameCallbackType;

  /**
   * Callback, invoked on an ERROR frame received from the STOMP Broker.
   * A compliant STOMP Broker will close the connection after this type of frame.
   *
   * The actual frame is passed as parameter to the callback.
   *
   * See https://stomp.github.io/stomp-specification-1.2.html#ERROR.
   */
  public onStompError: frameCallbackType;

  /**
   * Callback, invoked when underlying WebSocket is closed.
   *
   * Actual `event` is passed as parameter to the callback.
   */
  public onWebSocketClose: closeEventCallbackType;

  /**
   * By default, debug messages are discarded. To log to `console` following can be used:
   *
   * ```javascript
   *        client.debug = function(str) {
   *          console.log(str);
   *        };
   * ```
   *
   * This method is called for every actual transmission of the STOMP frames over the
   * WebSocket.
   */
  public debug: debugFnType;

  /**
   * version of STOMP protocol negotiated with the server, READONLY
   */
  get version(): string {
    return this._stompHandler ? this._stompHandler.version : undefined;
  }

  private _stompHandler: StompHandler;

  private _active: boolean = false;
  private _reconnector: any;

  /**
   * Create an instance.
   */
  constructor(conf: StompConfig = {}) {
    // Dummy callbacks
    const noOp = () => {};
    this.debug = noOp;
    this.onConnect = noOp;
    this.onDisconnect = noOp;
    this.onUnhandledMessage = noOp;
    this.onReceipt = noOp;
    this.onStompError = noOp;
    this.onWebSocketClose = noOp;

    // These parameters would typically get proper values before connect is called
    this.connectHeaders = {};
    this.disconnectHeaders = {};
    this.webSocketFactory = () => null;

    // Apply configuration
    this.configure(conf);
  }

  /**
   * Update configuration. See {@link StompConfig} for details of configuration options.
   */
  public configure(conf: StompConfig): void {
    // bulk assign all properties to this
    (<any>Object).assign(this, conf);
  }

  /**
   * Initiate the connection. If the connection breaks it will keep trying to reconnect.
   *
   * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
   */
  public activate(): void {
    // Indicate that this connection is active (it will keep trying to connect)
    this._active = true;

    this._connect();
  }

  private _connect(): void {
    if (!this._active) {
      this.debug('Client has been marked inactive, will not attempt to connect');
      return;
    }

    this.debug("Opening Web Socket...");

    // Get the actual Websocket (or a similar object)
    this._webSocket = this._createWebSocket();

    this._stompHandler = new StompHandler(this, this._webSocket, {
      debug: this.debug,
      connectHeaders: this.connectHeaders,
      disconnectHeaders: this.disconnectHeaders,
      heartbeatIncoming: this.heartbeatIncoming,
      heartbeatOutgoing: this.heartbeatOutgoing,
      maxWebSocketFrameSize: this.maxWebSocketFrameSize,
      onConnect: (frame) => {
        if (!this._active) {
          this.debug('STOMP got connected while deactivate was issued, will disconnect now');
          this._disposeStompHandler();
          return;
        }
        this.onConnect(frame);
      },
      onDisconnect: (frame) => {
        this.onDisconnect(frame);
      },
      onStompError: (frame) => {
        this.onStompError(frame);
      },
      onWebSocketClose: (evt) => {
        this.onWebSocketClose(evt);
        if (this._active) {
          this._schedule_reconnect();
        }
      },
      onUnhandledMessage: (message) => {
        this.onUnhandledMessage(message);
      },
      onReceipt: (frame) => {
        this.onReceipt(frame);
      }
    });

    this._stompHandler.start();
  }

  private _createWebSocket() {
    const webSocket = this.webSocketFactory();
    webSocket.binaryType = "arraybuffer";
    return webSocket;
  }

  private _schedule_reconnect(): void {
    if (this.reconnectDelay > 0) {
      this.debug(`STOMP: scheduling reconnection in ${this.reconnectDelay}ms`);
      // setTimeout is available in both Browser and Node.js environments
      this._reconnector = setTimeout(() => {
        if (this.connected) {
          this.debug('STOMP: already connected')
        } else {
          this.debug('STOMP: attempting to reconnect');
          this._connect();
        }
      }, this.reconnectDelay);
    }
  }

  /**
   * Disconnect from the STOMP broker. To ensure graceful shutdown it sends a DISCONNECT Frame
   * and wait till the broker acknowledges.
   *
   * disconnectCallback will be called only if the broker was actually connected.
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#DISCONNECT DISCONNECT Frame
   */
  public deactivate(): void {
    // indicate that auto reconnect loop should terminate
    this._active = false;

    // Clear if a reconnection was scheduled
    if (this._reconnector) {
      clearTimeout(this._reconnector);
    }
    this._disposeStompHandler();
  }

  private _disposeStompHandler() {
    // Dispose STOMP Handler
    if (this._stompHandler) {
      this._stompHandler.dispose();
      this._stompHandler = null;
    }
  }

  /**
   * Send a message to a named destination. Refer to your STOMP broker documentation for types
   * and naming of destinations. The headers will, typically, be available to the subscriber.
   * However, there may be special purpose headers corresponding to your STOMP broker.
   *
   * Note: Body must be String. You will need to covert the payload to string in case it is not string (e.g. JSON)
   *
   * ```javascript
   *        client.send("/queue/test", {priority: 9}, "Hello, STOMP");
   *
   *        // If you want to send a message with a body, you must also pass the headers argument.
   *        client.send("/queue/test", {}, "Hello, STOMP");
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#SEND SEND Frame
   */
  public send(destination: string, headers: StompHeaders = {}, body: string = ''): void {
    this._stompHandler.send(destination, headers, body);
  }

  /**
   * Subscribe to a STOMP Broker location. The callbck will be invoked for each received message with
   * the {@link Message} as argument.
   *
   * Note: The library will generate an unique ID if there is none provided in the headers.
   *       To use your own ID, pass it using the headers argument.
   *
   * ```javascript
   *        callback = function(message) {
   *        // called when the client receives a STOMP message from the server
   *          if (message.body) {
   *            alert("got message with body " + message.body)
   *          } else {
   *            alert("got empty message");
   *          }
   *        });
   *
   *        var subscription = client.subscribe("/queue/test", callback);
   *
   *        // Explicit subscription id
   *        var mySubId = 'my-subscription-id-001';
   *        var subscription = client.subscribe(destination, callback, { id: mySubId });
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE SUBSCRIBE Frame
   */
  public subscribe(destination: string, callback: messageCallbackType, headers: StompHeaders = {}): StompSubscription {
    return this._stompHandler.subscribe(destination, callback, headers);
  }

  /**
   * It is preferable to unsubscribe from a subscription by calling
   * `unsubscribe()` directly on {@link StompSubscription} returned by `client.subscribe()`:
   *
   * ```javascript
   *        var subscription = client.subscribe(destination, onmessage);
   *        // ...
   *        subscription.unsubscribe();
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
   */
  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    this._stompHandler.unsubscribe(id, headers);
  }

  /**
   * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
   * and [abort]{@link Transaction#abort}.
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
   */
  public begin(transactionId: string): Transaction {
    return this._stompHandler.begin(transactionId);
  }

  /**
   * Commit a transaction.
   * It is preferable to commit a transaction by calling [commit]{@link Transaction#commit} directly on
   * {@link Transaction} returned by [client.begin]{@link Client#begin}.
   *
   * ```javascript
   *        var tx = client.begin(txId);
   *        //...
   *        tx.commit();
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#COMMIT COMMIT Frame
   */
  public commit(transactionId: string): void {
    this._stompHandler.commit(transactionId);
  }

  /**
   * Abort a transaction.
   * It is preferable to abort a transaction by calling [abort]{@link Transaction#abort} directly on
   * {@link Transaction} returned by [client.begin]{@link Client#begin}.
   *
   * ```javascript
   *        var tx = client.begin(txId);
   *        //...
   *        tx.abort();
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#ABORT ABORT Frame
   */
  public abort(transactionId: string): void {
    this._stompHandler.abort(transactionId);
  }

  /**
   * ACK a message. It is preferable to acknowledge a message by calling [ack]{@link Message#ack} directly
   * on the {@link Message} handled by a subscription callback:
   *
   * ```javascript
   *        var callback = function (message) {
   *          // process the message
   *          // acknowledge it
   *          message.ack();
   *        };
   *        client.subscribe(destination, callback, {'ack': 'client'});
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#ACK ACK Frame
   */
  public ack(messageId: string, subscriptionId: string, headers: StompHeaders = {}): void {
    this._stompHandler.ack(messageId, subscriptionId, headers);
  }

  /**
   * NACK a message. It is preferable to acknowledge a message by calling [nack]{@link Message#nack} directly
   * on the {@link Message} handled by a subscription callback:
   *
   * ```javascript
   *        var callback = function (message) {
   *          // process the message
   *          // an error occurs, nack it
   *          message.nack();
   *        };
   *        client.subscribe(destination, callback, {'ack': 'client'});
   * ```
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#NACK NACK Frame
   */
  public nack(messageId: string, subscriptionId: string, headers: StompHeaders = {}): void {
    this._stompHandler.nack(messageId, subscriptionId, headers);
  }
}