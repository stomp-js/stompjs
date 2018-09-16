import {StompHeaders} from "./stomp-headers";
import {StompSubscription} from "./stomp-subscription";
import {Transaction} from "./transaction";
import {
  closeEventCallbackType,
  debugFnType,
  frameCallbackType,
  messageCallbackType,
  messageCheckCallbackType,
  publishParams
} from "./types";
import {StompConfig} from './stomp-config';
import {StompHandler} from "./stomp-handler";

/**
 * STOMP Client Class.
 */
export class Client {
  /**
   * The URL for the STOMP broker to connect to.
   * Typically like `"ws://broker.329broker.com:15674/ws"` or `"wss://broker.329broker.com:15674/ws"`.
   *
   * Only one of this or [Client#webSocketFactory]{@link Client#webSocketFactory} need to be set.
   * If both are set, [Client#webSocketFactory]{@link Client#webSocketFactory} will be used.
   */
  public brokerURL: string;

  /**
   * This function should return a WebSocket or a similar (e.g. SockJS) object.
   * If your STOMP Broker supports WebSockets, prefer setting [Client#brokerURL]{@link Client#brokerURL}.
   *
   * If both this and [Client#brokerURL]{@link Client#brokerURL} are set, this will be used.
   *
   * Example:
   * ```javascript
   *        // use a WebSocket
   *        client.webSocketFactory= function () {
   *          return new WebSocket("wss://broker.329broker.com:15674/ws");
   *        };
   *
   *        // Typical usage with SockJS
   *        client.webSocketFactory= function () {
   *          return new SockJS("http://broker.329broker.com/stomp");
   *        };
   * ```
   */
  public webSocketFactory: () => WebSocket;

  /**
   *  automatically reconnect with delay in milliseconds, set to 0 to disable.
   */
  public reconnectDelay: number = 5000;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
   */
  public heartbeatIncoming: number = 10000;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
   */
  public heartbeatOutgoing: number = 10000;

  /**
   * Underlying WebSocket instance, READONLY.
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
   * Connection headers, important keys - `login`, `passcode`, `host`.
   * Though STOMP 1.2 standard marks these keys to be present, check your broker documentation for
   * details specific to your broker.
   */
  public connectHeaders: StompHeaders;

  /**
   * Disconnection headers.
   */
  public disconnectHeaders: StompHeaders;

  /**
   * This callback will be called with the incoming message frame {@link Message}.
   * If this function returns `true`, the [Frame#body]{@link Frame#body} will not be converted
   * to `string` and be returned as
   * [Uint8Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}.
   * If this returns `false`, the body will be assumed to UTF8 string and will be converted at `string`.
   *
   * By default this callback returns `false`, i.e., all messages are treated as text.
   *
   * Examples:
   * ```javascript
   *        // Treat all messages a binary
   *        client.treatMessageAsBinary = function(message) {
   *          return true;
   *        };

   *        // Treat a message as binary based on content-type
   *        // This header is not a standard header, while publishing messages it needs to be explicitly set.
   *        client.treatMessageAsBinary = function(message) {
   *          return message.headers['content-type'] === 'application/octet-stream';
   *        };
   * ```
   *
   */
  public treatMessageAsBinary: messageCheckCallbackType;

  /**
   * This function will be called for any unhandled messages.
   * It is useful for receiving messages sent to RabbitMQ temporary queues.
   *
   * It can also get invoked with stray messages while the server is processing
   * a request to [Client#unsubscribe]{@link Client#unsubscribe}
   * from an endpoint.
   *
   * The actual {@link Message} will be passed as parameter to the callback.
   */
  public onUnhandledMessage: messageCallbackType;

  /**
   * STOMP brokers can be requested to notify when an operation is actually completed.
   * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}. See
   * [Client#watchForReceipt]{@link Client#watchForReceipt} for examples.
   *
   * The actual {@link Frame} will be passed as parameter to the callback.
   */
  public onUnhandledReceipt: frameCallbackType;

  /**
   * Will be invoked if {@link Frame} of unknown type is received from the STOMP broker.
   *
   * The actual {@link Frame} will be passed as parameter to the callback.
   */
  public onUnhandledFrame: frameCallbackType;

  /**
   * `true` if there is a active connection with STOMP Broker
   */
  get connected(): boolean {
    return (!!this._stompHandler) && this._stompHandler.connected;
  }

  /**
   * Callback, invoked on every successful connection to the STOMP broker.
   *
   * The actual {@link Frame} will be passed as parameter to the callback.
   * Sometimes clients will like to use headers from this frame.
   */
  public onConnect: frameCallbackType;

  /**
   * Callback, invoked on every successful disconnection from the STOMP broker. It will not be invoked if
   * the STOMP broker disconnected due to an error.
   *
   * The actual Receipt {@link Frame} acknowledging the DISCONNECT will be passed as parameter to the callback.
   *
   * The way STOMP protocol is designed, the connection may close/terminate without the client
   * receiving the Receipt {@link Frame} acknowledging the DISCONNECT.
   * You might find [Client#onWebSocketClose]{@link Client#onWebSocketClose} more appropriate to watch
   * STOMP broker disconnects.
   */
  public onDisconnect: frameCallbackType;

  /**
   * Callback, invoked on an ERROR frame received from the STOMP Broker.
   * A compliant STOMP Broker will close the connection after this type of frame.
   * Please check broker specific documentation for exact behavior.
   *
   * The actual {@link Frame} will be passed as parameter to the callback.
   */
  public onStompError: frameCallbackType;

  /**
   * Callback, invoked when underlying WebSocket is closed.
   *
   * Actual [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
   * is passed as parameter to the callback.
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
   * Currently this method does not support levels of log. Be aware that the output can be quite verbose
   * and may contain sensitive information (like passwords, tokens etc.).
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
    // Treat messages as text by default
    this.treatMessageAsBinary = (message) => {
      return false;
    };
    this.onUnhandledMessage = noOp;
    this.onUnhandledReceipt = noOp;
    this.onUnhandledFrame = noOp;
    this.onStompError = noOp;
    this.onWebSocketClose = noOp;

    // These parameters would typically get proper values before connect is called
    this.connectHeaders = {};
    this.disconnectHeaders = {};

    // Apply configuration
    this.configure(conf);
  }

  /**
   * Update configuration.
   */
  public configure(conf: StompConfig): void {
    // bulk assign all properties to this
    (<any>Object).assign(this, conf);
  }

  /**
   * Initiate the connection with the broker.
   * If the connection breaks, as per [Client#reconnectDelay]{@link Client#reconnectDelay},
   * it will keep trying to reconnect.
   *
   * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
   */
  public activate(): void {
    this._active = true;

    this._connect();
  }

  private _connect(): void {
    if (!this._active) {
      this.debug('Client has been marked inactive, will not attempt to connect');
      return;
    }

    if (this.connected) {
      this.debug('STOMP: already connected, nothing to do');
      return;
    }

    this.debug("Opening Web Socket...");

    // Get the actual WebSocket (or a similar object)
    this._webSocket = this._createWebSocket();

    this._stompHandler = new StompHandler(this, this._webSocket, {
      debug: this.debug,
      connectHeaders: this.connectHeaders,
      disconnectHeaders: this.disconnectHeaders,
      heartbeatIncoming: this.heartbeatIncoming,
      heartbeatOutgoing: this.heartbeatOutgoing,
      treatMessageAsBinary: this.treatMessageAsBinary,
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
        // The callback is called before attempting to reconnect, this would allow the client
        // to be `deactivated` in the callback.
        if (this._active) {
          this._schedule_reconnect();
        }
      },
      onUnhandledMessage: (message) => {
        this.onUnhandledMessage(message);
      },
      onUnhandledReceipt: (frame) => {
        this.onUnhandledReceipt(frame);
      },
      onUnhandledFrame: (frame) => {
        this.onUnhandledFrame(frame);
      }
    });

    this._stompHandler.start();
  }

  private _createWebSocket() {
    const webSocket = this.webSocketFactory ? this.webSocketFactory() : new WebSocket(this.brokerURL);
    webSocket.binaryType = "arraybuffer";
    return webSocket;
  }

  private _schedule_reconnect(): void {
    if (this.reconnectDelay > 0) {
      this.debug(`STOMP: scheduling reconnection in ${this.reconnectDelay}ms`);

      this._reconnector = setTimeout(() => {
        this._connect();
      }, this.reconnectDelay);
    }
  }

  /**
   * Disconnect if connected and stop auto reconnect loop.
   * Appropriate callbacks will be invoked if underlying STOMP connection was connected.
   *
   * To reactivate the {@link Client} you can call [Client#activate]{@link Client#activate}.
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

  /**
   * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
   * This is different than a normal disconnect where a DISCONNECT sequence is carried out with the broker.
   * After forcing disconnect, automatic reconnect will be attempted.
   * To stop further reconnects call [Client#deactivate]{@link Client#deactivate} as well.
   */
  public forceDisconnect() {
    if (this._webSocket) {
      if (this._webSocket.readyState === WebSocket.CONNECTING || this._webSocket.readyState === WebSocket.OPEN) {
        this._webSocket.close();
      }
    }
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
   * and naming of destinations.
   *
   * STOMP protocol specifies and suggests some headers and also allows broker specific headers.
   *
   * Note: Body must be String or
   * [Unit8Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}.
   * If the body is
   * [Unit8Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}
   * the frame will be sent as binary.
   * Sometimes brokers may not support binary frames out of the box.
   * Please check your broker documentation.
   *
   * You will need to covert the payload to string in case it is not string (e.g. JSON)
   *
   * ```javascript
   *        client.publish({destination: "/queue/test", headers: {priority: 9}, body: "Hello, STOMP"});
   *
   *        // Only destination is mandatory parameter
   *        client.publish({destination: "/queue/test", body: "Hello, STOMP"});
   *
   *        // Skip content-length header in the frame to the broker
   *        client.publish({"/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true});
   * ```
   */
  public publish(params: publishParams) {
    this._stompHandler.publish(params);
  }

  /**
   * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
   * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
   * The value (say receipt-id) for this header needs to be unique for each use. Typically a sequence, a UUID, a
   * random number or a combination may be used.
   *
   * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
   * The operation needs to be matched based in the value of the receipt-id.
   *
   * This method allow watching for a receipt and invoke the callback
   * when corresponding receipt has been received.
   *
   * The actual {@link Frame} will be passed as parameter to the callback.
   *
   * Example:
   * ```javascript
   *        // Subscribing with acknowledgement
   *        let receiptId = randomText();
   *
   *        client.watchForReceipt(receiptId, function() {
   *          // Will be called after server acknowledges
   *        });
   *
   *        client.subscribe(TEST.destination, onMessage, {receipt: receiptId});
   *
   *
   *        // Publishing with acknowledgement
   *        receiptId = randomText();
   *
   *        client.watchForReceipt(receiptId, function() {
   *          // Will be called after server acknowledges
   *        });
   *        client.publish({destination: TEST.destination, headers: {receipt: receiptId}, body: msg});
   * ```
   */
  public watchForReceipt(receiptId: string, callback: frameCallbackType): void {
    this._stompHandler.watchForReceipt(receiptId, callback);
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
   * See: http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
   */
  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    this._stompHandler.unsubscribe(id, headers);
  }

  /**
   * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
   * and [abort]{@link Transaction#abort}.
   *
   * `transactionId` is optional, if not passed the library will generate it internally.
   */
  public begin(transactionId?: string): Transaction {
    return this._stompHandler.begin(transactionId);
  }

  /**
   * Commit a transaction.
   *
   * It is preferable to commit a transaction by calling [commit]{@link Transaction#commit} directly on
   * {@link Transaction} returned by [client.begin]{@link Client#begin}.
   *
   * ```javascript
   *        var tx = client.begin(txId);
   *        //...
   *        tx.commit();
   * ```
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
   */
  public nack(messageId: string, subscriptionId: string, headers: StompHeaders = {}): void {
    this._stompHandler.nack(messageId, subscriptionId, headers);
  }
}