import { ITransaction } from './i-transaction.js';
import { StompConfig } from './stomp-config.js';
import { StompHandler } from './stomp-handler.js';
import { StompHeaders } from './stomp-headers.js';
import { StompSubscription } from './stomp-subscription.js';
import {
  ActivationState,
  closeEventCallbackType,
  debugFnType,
  frameCallbackType,
  IPublishParams,
  IStompSocket,
  messageCallbackType,
  ReconnectionTimeMode,
  StompSocketState,
  wsErrorCallbackType,
} from './types.js';
import { Versions } from './versions.js';

/**
 * @internal
 */
declare const WebSocket: {
  prototype: IStompSocket;
  new (url: string, protocols?: string | string[]): IStompSocket;
};

/**
 * STOMP Client Class.
 *
 * Part of `@stomp/stompjs`.
 */
export class Client {
  /**
   * The URL for the STOMP broker to connect to.
   * Typically like `"ws://broker.329broker.com:15674/ws"` or `"wss://broker.329broker.com:15674/ws"`.
   *
   * Only one of this or [Client#webSocketFactory]{@link Client#webSocketFactory} need to be set.
   * If both are set, [Client#webSocketFactory]{@link Client#webSocketFactory} will be used.
   *
   * If your environment does not support WebSockets natively, please refer to
   * [Polyfills]{@link https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html}.
   */
  public brokerURL: string | undefined;

  /**
   * STOMP versions to attempt during STOMP handshake. By default, versions `1.2`, `1.1`, and `1.0` are attempted.
   *
   * Example:
   * ```javascript
   *        // Try only versions 1.1 and 1.0
   *        client.stompVersions = new Versions(['1.1', '1.0'])
   * ```
   */
  public stompVersions = Versions.default;

  /**
   * This function should return a WebSocket or a similar (e.g. SockJS) object.
   * If your environment does not support WebSockets natively, please refer to
   * [Polyfills]{@link https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html}.
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
  public webSocketFactory: (() => IStompSocket) | undefined;

  /**
   * Will retry if Stomp connection is not established in specified milliseconds.
   * Default 0, which switches off automatic reconnection.
   */
  public connectionTimeout: number = 0;

  // As per https://stackoverflow.com/questions/45802988/typescript-use-correct-version-of-settimeout-node-vs-window/56239226#56239226
  private _connectionWatcher: ReturnType<typeof setTimeout> | undefined; // Timer

  /**
   *  automatically reconnect with delay in milliseconds, set to 0 to disable.
   */
  public reconnectDelay: number = 5000;

  /**
   * tracking the time to the next reconnection. Initialized to [Client#reconnectDelay]{@link Client#reconnectDelay}'s value and it may 
   * change depending on the [Client#reconnectTimeMode]{@link Client#reconnectTimeMode} setting
   */
  private _nextReconnectDelay: number = 0;

  /**
   * Maximum time to wait between reconnects, in milliseconds. Defaults to 15 minutes.
   * Only relevant when reconnectTimeMode not LINEAR (e.g. EXPONENTIAL).
   * Set to 0 to wait indefinitely.
   */
  public maxReconnectDelay: number = 15 * 60 * 1000; // 15 minutes in ms


  /**
   * Reconnection wait time mode, either linear (default) or exponential.
   * Note: See [Client#maxReconnectDelay]{@link Client#maxReconnectDelay} for setting the maximum delay when exponential
   */
  public reconnectTimeMode: ReconnectionTimeMode = ReconnectionTimeMode.LINEAR;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable.
   */
  public heartbeatIncoming: number = 10000;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable.
   */
  public heartbeatOutgoing: number = 10000;

  /**
   * This switches on a non-standard behavior while sending WebSocket packets.
   * It splits larger (text) packets into chunks of [maxWebSocketChunkSize]{@link Client#maxWebSocketChunkSize}.
   * Only Java Spring brokers seem to support this mode.
   *
   * WebSockets, by itself, split large (text) packets,
   * so it is not needed with a truly compliant STOMP/WebSocket broker.
   * Setting it for such a broker will cause large messages to fail.
   *
   * `false` by default.
   *
   * Binary frames are never split.
   */
  public splitLargeFrames: boolean = false;

  /**
   * See [splitLargeFrames]{@link Client#splitLargeFrames}.
   * This has no effect if [splitLargeFrames]{@link Client#splitLargeFrames} is `false`.
   */
  public maxWebSocketChunkSize: number = 8 * 1024;

  /**
   * Usually the
   * [type of WebSocket frame]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send#Parameters}
   * is automatically decided by type of the payload.
   * Default is `false`, which should work with all compliant brokers.
   *
   * Set this flag to force binary frames.
   */
  public forceBinaryWSFrames: boolean = false;

  /**
   * A bug in ReactNative chops a string on occurrence of a NULL.
   * See issue [https://github.com/stomp-js/stompjs/issues/89]{@link https://github.com/stomp-js/stompjs/issues/89}.
   * This makes incoming WebSocket messages invalid STOMP packets.
   * Setting this flag attempts to reverse the damage by appending a NULL.
   * If the broker splits a large message into multiple WebSocket messages,
   * this flag will cause data loss and abnormal termination of connection.
   *
   * This is not an ideal solution, but a stop gap until the underlying issue is fixed at ReactNative library.
   */
  public appendMissingNULLonIncoming: boolean = false;

  /**
   * Underlying WebSocket instance, READONLY.
   */
  get webSocket(): IStompSocket | undefined {
    return this._stompHandler?._webSocket;
  }

  /**
   * Connection headers, important keys - `login`, `passcode`, `host`.
   * Though STOMP 1.2 standard marks these keys to be present, check your broker documentation for
   * details specific to your broker.
   */
  public connectHeaders: StompHeaders;

  /**
   * Disconnection headers.
   */
  get disconnectHeaders(): StompHeaders {
    return this._disconnectHeaders;
  }

  set disconnectHeaders(value: StompHeaders) {
    this._disconnectHeaders = value;
    if (this._stompHandler) {
      this._stompHandler.disconnectHeaders = this._disconnectHeaders;
    }
  }
  private _disconnectHeaders: StompHeaders;

  /**
   * This function will be called for any unhandled messages.
   * It is useful for receiving messages sent to RabbitMQ temporary queues.
   *
   * It can also get invoked with stray messages while the server is processing
   * a request to [Client#unsubscribe]{@link Client#unsubscribe}
   * from an endpoint.
   *
   * The actual {@link IMessage} will be passed as parameter to the callback.
   */
  public onUnhandledMessage: messageCallbackType;

  /**
   * STOMP brokers can be requested to notify when an operation is actually completed.
   * Prefer using [Client#watchForReceipt]{@link Client#watchForReceipt}. See
   * [Client#watchForReceipt]{@link Client#watchForReceipt} for examples.
   *
   * The actual {@link IFrame} will be passed as parameter to the callback.
   */
  public onUnhandledReceipt: frameCallbackType;

  /**
   * Will be invoked if {@link IFrame} of an unknown type is received from the STOMP broker.
   *
   * The actual {@link IFrame} will be passed as parameter to the callback.
   */
  public onUnhandledFrame: frameCallbackType;

  /**
   * `true` if there is an active connection to STOMP Broker
   */
  get connected(): boolean {
    return !!this._stompHandler && this._stompHandler.connected;
  }

  /**
   * Callback, invoked on before a connection to the STOMP broker.
   *
   * You can change options on the client, which will impact the immediate connecting.
   * It is valid to call [Client#decativate]{@link Client#deactivate} in this callback.
   *
   * As of version 5.1, this callback can be
   * [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
   * (i.e., it can return a
   * [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
   * In that case, connect will be called only after the Promise is resolved.
   * This can be used to reliably fetch credentials, access token etc. from some other service
   * in an asynchronous way.
   */
  public beforeConnect: () => void | Promise<void>;

  /**
   * Callback, invoked on every successful connection to the STOMP broker.
   *
   * The actual {@link IFrame} will be passed as parameter to the callback.
   * Sometimes clients will like to use headers from this frame.
   */
  public onConnect: frameCallbackType;

  /**
   * Callback, invoked on every successful disconnection from the STOMP broker. It will not be invoked if
   * the STOMP broker disconnected due to an error.
   *
   * The actual Receipt {@link IFrame} acknowledging the DISCONNECT will be passed as parameter to the callback.
   *
   * The way STOMP protocol is designed, the connection may close/terminate without the client
   * receiving the Receipt {@link IFrame} acknowledging the DISCONNECT.
   * You might find [Client#onWebSocketClose]{@link Client#onWebSocketClose} more appropriate to watch
   * STOMP broker disconnects.
   */
  public onDisconnect: frameCallbackType;

  /**
   * Callback, invoked on an ERROR frame received from the STOMP Broker.
   * A compliant STOMP Broker will close the connection after this type of frame.
   * Please check broker specific documentation for exact behavior.
   *
   * The actual {@link IFrame} will be passed as parameter to the callback.
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
   * Callback, invoked when underlying WebSocket raises an error.
   *
   * Actual [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
   * is passed as parameter to the callback.
   */
  public onWebSocketError: wsErrorCallbackType;

  /**
   * Set it to log the actual raw communication with the broker.
   * When unset, it logs headers of the parsed frames.
   *
   * Changes effect from the next broker reconnect.
   *
   * **Caution: this assumes that frames only have valid UTF8 strings.**
   */
  public logRawCommunication: boolean;

  /**
   * By default, debug messages are discarded. To log to `console` following can be used:
   *
   * ```javascript
   *        client.debug = function(str) {
   *          console.log(str);
   *        };
   * ```
   *
   * Currently this method does not support levels of log. Be aware that the
   * output can be quite verbose
   * and may contain sensitive information (like passwords, tokens etc.).
   */
  public debug: debugFnType;

  /**
   * Browsers do not immediately close WebSockets when `.close` is issued.
   * This may cause reconnection to take a significantly long time in case
   *  of some types of failures.
   * In case of incoming heartbeat failure, this experimental flag instructs
   * the library to discard the socket immediately
   * (even before it is actually closed).
   */
  public discardWebsocketOnCommFailure: boolean = false;

  /**
   * version of STOMP protocol negotiated with the server, READONLY
   */
  get connectedVersion(): string | undefined {
    return this._stompHandler ? this._stompHandler.connectedVersion : undefined;
  }

  private _stompHandler: StompHandler | undefined;

  /**
   * if the client is active (connected or going to reconnect)
   */
  get active(): boolean {
    return this.state === ActivationState.ACTIVE;
  }

  /**
   * It will be called on state change.
   *
   * When deactivating, it may go from ACTIVE to INACTIVE without entering DEACTIVATING.
   */
  public onChangeState: (state: ActivationState) => void;

  private _changeState(state: ActivationState) {
    this.state = state;
    this.onChangeState(state);
  }

  /**
   * Activation state.
   *
   * It will usually be ACTIVE or INACTIVE.
   * When deactivating, it may go from ACTIVE to INACTIVE without entering DEACTIVATING.
   */
  public state: ActivationState = ActivationState.INACTIVE;

  private _reconnector: any;

  /**
   * Create an instance.
   */
  constructor(conf: StompConfig = {}) {
    // No op callbacks
    const noOp = () => {};
    this.debug = noOp;
    this.beforeConnect = noOp;
    this.onConnect = noOp;
    this.onDisconnect = noOp;
    this.onUnhandledMessage = noOp;
    this.onUnhandledReceipt = noOp;
    this.onUnhandledFrame = noOp;
    this.onStompError = noOp;
    this.onWebSocketClose = noOp;
    this.onWebSocketError = noOp;
    this.logRawCommunication = false;
    this.onChangeState = noOp;

    // These parameters would typically get proper values before connect is called
    this.connectHeaders = {};
    this._disconnectHeaders = {};

    // Apply configuration
    this.configure(conf);
  }

  /**
   * Update configuration.
   */
  public configure(conf: StompConfig): void {
    // bulk assign all properties to this
    (Object as any).assign(this, conf);

    // Warn on incorrect maxReconnectDelay settings
    if (this.maxReconnectDelay > 0 && this.maxReconnectDelay < this.reconnectDelay) {
      this.debug(`Warning: maxReconnectDelay (${this.maxReconnectDelay}ms) is less than reconnectDelay (${this.reconnectDelay}ms). Using reconnectDelay as the maxReconnectDelay delay.`);
      this.maxReconnectDelay = this.reconnectDelay;
    }
  }

  /**
   * Initiate the connection with the broker.
   * If the connection breaks, as per [Client#reconnectDelay]{@link Client#reconnectDelay},
   * it will keep trying to reconnect. If the [Client#reconnectTimeMode]{@link Client#reconnectTimeMode} 
   * is set to EXPONENTIAL it will increase the wait time exponentially
   *
   * Call [Client#deactivate]{@link Client#deactivate} to disconnect and stop reconnection attempts.
   */
  public activate(): void {
    const _activate = () => {
      if (this.active) {
        this.debug('Already ACTIVE, ignoring request to activate');
        return;
      }

      this._changeState(ActivationState.ACTIVE);

      this._nextReconnectDelay = this.reconnectDelay;
      this._connect();
    };

    // if it is deactivating, wait for it to complete before activating.
    if (this.state === ActivationState.DEACTIVATING) {
      this.debug('Waiting for deactivation to finish before activating');
      this.deactivate().then(() => {
        _activate();
      });
    } else {
      _activate();
    }
  }

  private async _connect(): Promise<void> {
    await this.beforeConnect();

    if (this._stompHandler) {
      this.debug('There is already a stompHandler, skipping the call to connect');
      return;
    }

    if (!this.active) {
      this.debug(
        'Client has been marked inactive, will not attempt to connect'
      );
      return;
    }

    // setup connection watcher
    if (this.connectionTimeout > 0) {
      // clear first
      if (this._connectionWatcher) {
        clearTimeout(this._connectionWatcher);
      }
      this._connectionWatcher = setTimeout(() => {
        if (this.connected) {
          return;
        }
        // Connection not established, close the underlying socket
        // a reconnection will be attempted
        this.debug(
          `Connection not established in ${this.connectionTimeout}ms, closing socket`
        );
        this.forceDisconnect();
      }, this.connectionTimeout);
    }

    this.debug('Opening Web Socket...');

    // Get the actual WebSocket (or a similar object)
    const webSocket = this._createWebSocket();

    this._stompHandler = new StompHandler(this, webSocket, {
      debug: this.debug,
      stompVersions: this.stompVersions,
      connectHeaders: this.connectHeaders,
      disconnectHeaders: this._disconnectHeaders,
      heartbeatIncoming: this.heartbeatIncoming,
      heartbeatOutgoing: this.heartbeatOutgoing,
      splitLargeFrames: this.splitLargeFrames,
      maxWebSocketChunkSize: this.maxWebSocketChunkSize,
      forceBinaryWSFrames: this.forceBinaryWSFrames,
      logRawCommunication: this.logRawCommunication,
      appendMissingNULLonIncoming: this.appendMissingNULLonIncoming,
      discardWebsocketOnCommFailure: this.discardWebsocketOnCommFailure,

      onConnect: frame => {
        // Successfully connected, stop the connection watcher
        if (this._connectionWatcher) {
          clearTimeout(this._connectionWatcher);
          this._connectionWatcher = undefined;
        }

        if (!this.active) {
          this.debug(
            'STOMP got connected while deactivate was issued, will disconnect now'
          );
          this._disposeStompHandler();
          return;
        }
        this.onConnect(frame);
      },
      onDisconnect: frame => {
        this.onDisconnect(frame);
      },
      onStompError: frame => {
        this.onStompError(frame);
      },
      onWebSocketClose: evt => {
        this._stompHandler = undefined; // a new one will be created in case of a reconnect

        if (this.state === ActivationState.DEACTIVATING) {
          // Mark deactivation complete
          this._changeState(ActivationState.INACTIVE);
        }

        // The callback is called before attempting to reconnect, this would allow the client
        // to be `deactivated` in the callback.
        this.onWebSocketClose(evt);

        if (this.active) {
          this._schedule_reconnect();
        }
      },
      onWebSocketError: evt => {
        this.onWebSocketError(evt);
      },
      onUnhandledMessage: message => {
        this.onUnhandledMessage(message);
      },
      onUnhandledReceipt: frame => {
        this.onUnhandledReceipt(frame);
      },
      onUnhandledFrame: frame => {
        this.onUnhandledFrame(frame);
      },
    });

    this._stompHandler.start();
  }

  private _createWebSocket(): IStompSocket {
    let webSocket: IStompSocket;

    if (this.webSocketFactory) {
      webSocket = this.webSocketFactory();
    } else if (this.brokerURL) {
      webSocket = new WebSocket(
        this.brokerURL,
        this.stompVersions.protocolVersions()
      );
    } else {
      throw new Error('Either brokerURL or webSocketFactory must be provided');
    }
    webSocket.binaryType = 'arraybuffer';
    return webSocket;
  }

  private _schedule_reconnect(): void {
    if (this._nextReconnectDelay > 0) {
      this.debug(`STOMP: scheduling reconnection in ${this._nextReconnectDelay}ms`);

      this._reconnector = setTimeout(() => {
        if (this.reconnectTimeMode === ReconnectionTimeMode.EXPONENTIAL) {
          this._nextReconnectDelay = this._nextReconnectDelay * 2;

          // Truncated exponential backoff with a set limit unless disabled
          if (this.maxReconnectDelay !== 0) {
            this._nextReconnectDelay = Math.min(this._nextReconnectDelay, this.maxReconnectDelay)
          }
        }

        this._connect();
      }, this._nextReconnectDelay);
    }
  }

  /**
   * Disconnect if connected and stop auto reconnect loop.
   * Appropriate callbacks will be invoked if there is an underlying STOMP connection.
   *
   * This call is async. It will resolve immediately if there is no underlying active websocket,
   * otherwise, it will resolve after the underlying websocket is properly disposed of.
   *
   * It is not an error to invoke this method more than once.
   * Each of those would resolve on completion of deactivation.
   *
   * To reactivate, you can call [Client#activate]{@link Client#activate}.
   *
   * Experimental: pass `force: true` to immediately discard the underlying connection.
   * This mode will skip both the STOMP and the Websocket shutdown sequences.
   * In some cases, browsers take a long time in the Websocket shutdown
   * if the underlying connection had gone stale.
   * Using this mode can speed up.
   * When this mode is used, the actual Websocket may linger for a while
   * and the broker may not realize that the connection is no longer in use.
   *
   * It is possible to invoke this method initially without the `force` option
   * and subsequently, say after a wait, with the `force` option.
   */
  public async deactivate(options: { force?: boolean } = {}): Promise<void> {
    const force: boolean = options.force || false;
    const needToDispose = this.active;
    let retPromise: Promise<void>;

    if (this.state === ActivationState.INACTIVE) {
      this.debug(`Already INACTIVE, nothing more to do`);
      return Promise.resolve();
    }

    this._changeState(ActivationState.DEACTIVATING);

    // Reset reconnection timer just to be safe
    this._nextReconnectDelay = 0;

    // Clear if a reconnection was scheduled
    if (this._reconnector) {
      clearTimeout(this._reconnector);
      this._reconnector = undefined;
    }

    if (
      this._stompHandler &&
      // @ts-ignore - if there is a _stompHandler, there is the webSocket
      this.webSocket.readyState !== StompSocketState.CLOSED
    ) {
      const origOnWebSocketClose = this._stompHandler.onWebSocketClose;
      // we need to wait for the underlying websocket to close
      retPromise = new Promise<void>((resolve, reject) => {
        // @ts-ignore - there is a _stompHandler
        this._stompHandler.onWebSocketClose = evt => {
          origOnWebSocketClose(evt);
          resolve();
        };
      });
    } else {
      // indicate that auto reconnect loop should terminate
      this._changeState(ActivationState.INACTIVE);
      return Promise.resolve();
    }

    if (force) {
      this._stompHandler?.discardWebsocket();
    } else if (needToDispose) {
      this._disposeStompHandler();
    }

    return retPromise;
  }

  /**
   * Force disconnect if there is an active connection by directly closing the underlying WebSocket.
   * This is different from a normal disconnect where a DISCONNECT sequence is carried out with the broker.
   * After forcing disconnect, automatic reconnect will be attempted.
   * To stop further reconnects call [Client#deactivate]{@link Client#deactivate} as well.
   */
  public forceDisconnect() {
    if (this._stompHandler) {
      this._stompHandler.forceDisconnect();
    }
  }

  private _disposeStompHandler() {
    // Dispose STOMP Handler
    if (this._stompHandler) {
      this._stompHandler.dispose();
    }
  }

  /**
   * Send a message to a named destination. Refer to your STOMP broker documentation for types
   * and naming of destinations.
   *
   * STOMP protocol specifies and suggests some headers and also allows broker-specific headers.
   *
   * `body` must be String.
   * You will need to covert the payload to string in case it is not string (e.g. JSON).
   *
   * To send a binary message body, use `binaryBody` parameter. It should be a
   * [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
   * Sometimes brokers may not support binary frames out of the box.
   * Please check your broker documentation.
   *
   * `content-length` header is automatically added to the STOMP Frame sent to the broker.
   * Set `skipContentLengthHeader` to indicate that `content-length` header should not be added.
   * For binary messages, `content-length` header is always added.
   *
   * Caution: The broker will, most likely, report an error and disconnect
   * if the message body has NULL octet(s) and `content-length` header is missing.
   *
   * ```javascript
   *        client.publish({destination: "/queue/test", headers: {priority: 9}, body: "Hello, STOMP"});
   *
   *        // Only destination is mandatory parameter
   *        client.publish({destination: "/queue/test", body: "Hello, STOMP"});
   *
   *        // Skip content-length header in the frame to the broker
   *        client.publish({"/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true});
   *
   *        var binaryData = generateBinaryData(); // This need to be of type Uint8Array
   *        // setting content-type header is not mandatory, however a good practice
   *        client.publish({destination: '/topic/special', binaryBody: binaryData,
   *                         headers: {'content-type': 'application/octet-stream'}});
   * ```
   */
  public publish(params: IPublishParams) {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.publish(params);
  }

  private _checkConnection() {
    if (!this.connected) {
      throw new TypeError('There is no underlying STOMP connection');
    }
  }

  /**
   * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
   * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
   * The value (say receipt-id) for this header needs to be unique for each use.
   * Typically, a sequence, a UUID, a random number or a combination may be used.
   *
   * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
   * The operation needs to be matched based on the value of the receipt-id.
   *
   * This method allows watching for a receipt and invoking the callback
   *  when the corresponding receipt has been received.
   *
   * The actual {@link IFrame} will be passed as parameter to the callback.
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
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.watchForReceipt(receiptId, callback);
  }

  /**
   * Subscribe to a STOMP Broker location. The callback will be invoked for each
   * received message with the {@link IMessage} as argument.
   *
   * Note: The library will generate a unique ID if there is none provided in the headers.
   *       To use your own ID, pass it using the `headers` argument.
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
  public subscribe(
    destination: string,
    callback: messageCallbackType,
    headers: StompHeaders = {}
  ): StompSubscription {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
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
   * See: https://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
   */
  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.unsubscribe(id, headers);
  }

  /**
   * Start a transaction, the returned {@link ITransaction} has methods - [commit]{@link ITransaction#commit}
   * and [abort]{@link ITransaction#abort}.
   *
   * `transactionId` is optional, if not passed the library will generate it internally.
   */
  public begin(transactionId?: string): ITransaction {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    return this._stompHandler.begin(transactionId);
  }

  /**
   * Commit a transaction.
   *
   * It is preferable to commit a transaction by calling [commit]{@link ITransaction#commit} directly on
   * {@link ITransaction} returned by [client.begin]{@link Client#begin}.
   *
   * ```javascript
   *        var tx = client.begin(txId);
   *        //...
   *        tx.commit();
   * ```
   */
  public commit(transactionId: string): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.commit(transactionId);
  }

  /**
   * Abort a transaction.
   * It is preferable to abort a transaction by calling [abort]{@link ITransaction#abort} directly on
   * {@link ITransaction} returned by [client.begin]{@link Client#begin}.
   *
   * ```javascript
   *        var tx = client.begin(txId);
   *        //...
   *        tx.abort();
   * ```
   */
  public abort(transactionId: string): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.abort(transactionId);
  }

  /**
   * ACK a message. It is preferable to acknowledge a message by calling [ack]{@link IMessage#ack} directly
   * on the {@link IMessage} handled by a subscription callback:
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
  public ack(
    messageId: string,
    subscriptionId: string,
    headers: StompHeaders = {}
  ): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.ack(messageId, subscriptionId, headers);
  }

  /**
   * NACK a message. It is preferable to acknowledge a message by calling [nack]{@link IMessage#nack} directly
   * on the {@link IMessage} handled by a subscription callback:
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
  public nack(
    messageId: string,
    subscriptionId: string,
    headers: StompHeaders = {}
  ): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.nack(messageId, subscriptionId, headers);
  }
}
