import { ITransaction } from './i-transaction.js';
import { StompConfig } from './stomp-config.js';
import { StompHandler } from './stomp-handler.js';
import { StompHeaders } from './stomp-headers.js';
import { StompSubscription } from './stomp-subscription.js';
import {
  ActivationState,
  closeEventCallbackType,
  debugFnType,
  emptyCallbackType,
  frameCallbackType,
  IPublishParams,
  IStompSocket,
  messageCallbackType,
  ReconnectionTimeMode,
  StompSocketState,
  TickerStrategy,
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
 *
 * This class provides a robust implementation for connecting to and interacting with a
 * STOMP-compliant messaging broker over WebSocket. It supports STOMP versions 1.2, 1.1, and 1.0.
 *
 * Features:
 * - Handles automatic reconnections.
 * - Supports heartbeat mechanisms to detect and report communication failures.
 * - Allows customization of connection and WebSocket behaviors through configurations.
 * - Compatible with both browser environments and Node.js with polyfill support for WebSocket.
 */
export class Client {
  /**
   * The URL for the STOMP broker to connect to.
   * Example: `"ws://broker.domain.com:15674/ws"` or `"wss://broker.domain.com:15674/ws"`.
   *
   * Use this property to define the broker's WebSocket endpoint.
   * Note:
   * - Only one of `brokerURL` or [Client#webSocketFactory]{@link Client#webSocketFactory} needs to be set.
   * - If both are provided, [Client#webSocketFactory]{@link Client#webSocketFactory} takes precedence.
   * - When targeting environments without native WebSocket support, refer to 
   *   [Polyfills]{@link https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html}.
   */
  public brokerURL: string | undefined;

  /**
   * STOMP protocol versions to use during the handshake. By default, the client will attempt
   * versions `1.2`, `1.1`, and `1.0` in descending order of preference.
   *
   * Example:
   * ```javascript
   * // Configure the client to only use versions 1.1 and 1.0
   * client.stompVersions = new Versions(['1.1', '1.0']);
   * ```
   */
  public stompVersions = Versions.default;

  /**
   * A function that returns a WebSocket or a similar object (e.g., SockJS) to establish connections.
   *
   * This is an alternative to [Client#brokerURL]{@link Client#brokerURL}.
   * Using this allows finer control over WebSocket creation, especially for custom wrappers
   * or when working in non-standard environments.
   *
   * Example:
   * ```javascript
   * client.webSocketFactory = function () {
   *   return new WebSocket("ws://my-custom-websocket-endpoint");
   * };
   *
   * // Typical usage with SockJS
   * client.webSocketFactory= function () {
   *   return new SockJS("http://broker.329broker.com/stomp");
   * };
   * ```
   *
   * Note:
   * - If both [Client#brokerURL]{@link Client#brokerURL} and this property are set, the factory will be used.
   * - Refer to [Polyfills Guide]{@link https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/pollyfils-for-stompjs-v5.html}
   *   when running in environments without native WebSocket support.
   */
  public webSocketFactory: (() => IStompSocket) | undefined;

  /**
   * Timeout for establishing STOMP connection, in milliseconds.
   * 
   * If the connection is not established within this period, the attempt will fail.
   * The default is `0`, meaning no timeout is set for connection attempts.
   * 
   * Example:
   * ```javascript
   * client.connectionTimeout = 5000; // Fail connection if not established in 5 seconds
   * ```
   */
  public connectionTimeout: number = 0;

  // Internal timer for handling connection timeout, if set.
  // See https://stackoverflow.com/questions/45802988/typescript-use-correct-version-of-settimeout-node-vs-window/56239226#56239226
  private _connectionWatcher: ReturnType<typeof setTimeout> | undefined;

  /**
   * Delay (in milliseconds) between reconnection attempts if the connection drops.
   * 
   * Set to `0` to disable automatic reconnections. The default value is `5000` ms (5 seconds).
   * 
   * Example:
   * ```javascript
   * client.reconnectDelay = 3000; // Attempt reconnection every 3 seconds
   * client.reconnectDelay = 0; // Disable automatic reconnection
   * ```
   */
  public reconnectDelay: number = 5000;

  /**
   * The next reconnection delay, used internally.
   * Initialized to the value of [Client#reconnectDelay]{@link Client#reconnectDelay}, and it may
   * dynamically change based on [Client#reconnectTimeMode]{@link Client#reconnectTimeMode}.
   */
  private _nextReconnectDelay: number = 0;

  /**
   * Maximum delay (in milliseconds) between reconnection attempts when using exponential backoff.
   * 
   * Default is 15 minutes (`15 * 60 * 1000` milliseconds). If `0`, there will be no upper limit.
   * 
   * Example:
   * ```javascript
   * client.maxReconnectDelay = 10000; // Maximum wait time is 10 seconds
   * ```
   */
  public maxReconnectDelay: number = 15 * 60 * 1000;

  /**
   * Mode for determining the time interval between reconnection attempts.
   * 
   * Available modes:
   * - `ReconnectionTimeMode.LINEAR` (default): Fixed delays between reconnection attempts.
   * - `ReconnectionTimeMode.EXPONENTIAL`: Delay doubles after each attempt, capped by [maxReconnectDelay]{@link Client#maxReconnectDelay}.
   * 
   * Example:
   * ```javascript
   * client.reconnectTimeMode = ReconnectionTimeMode.EXPONENTIAL;
   * client.reconnectDelay = 200; // Initial delay of 200 ms, doubles with each attempt
   * client.maxReconnectDelay = 2 * 60 * 1000; // Cap delay at 10 minutes
   * ```
   */
  public reconnectTimeMode: ReconnectionTimeMode = ReconnectionTimeMode.LINEAR;

  /**
   * Interval (in milliseconds) for receiving heartbeat signals from the server.
   * 
   * Specifies the expected frequency of heartbeats sent by the server. Set to `0` to disable.
   * 
   * Example:
   * ```javascript
   * client.heartbeatIncoming = 10000; // Expect a heartbeat every 10 seconds
   * ```
   */
  public heartbeatIncoming: number = 10000;

  /**
   * Multiplier for adjusting tolerance when processing heartbeat signals.
   * 
   * Tolerance level is calculated using the multiplier:
   * `tolerance = heartbeatIncoming * heartbeatToleranceMultiplier`.
   * This helps account for delays in network communication or variations in timings.
   * 
   * Default value is `2`.
   * 
   * Example:
   * ```javascript
   * client.heartbeatToleranceMultiplier = 2.5; // Tolerates longer delays
   * ```
   */
  public heartbeatToleranceMultiplier: number = 2;

  /**
   * Interval (in milliseconds) for sending heartbeat signals to the server.
   * 
   * Specifies how frequently heartbeats should be sent to the server. Set to `0` to disable.
   * 
   * Example:
   * ```javascript
   * client.heartbeatOutgoing = 5000; // Send a heartbeat every 5 seconds
   * ```
   */
  public heartbeatOutgoing: number = 10000;

  /**
   * Strategy for sending outgoing heartbeats.
   * 
   * Options:
   * - `TickerStrategy.Worker`: Uses Web Workers for sending heartbeats (recommended for long-running or background sessions).
   * - `TickerStrategy.Interval`: Uses standard JavaScript `setInterval` (default).
   * 
   * Note:
   * - If Web Workers are unavailable (e.g., in Node.js), the `Interval` strategy is used automatically.
   * - Web Workers are preferable in browsers for reducing disconnects when tabs are in the background.
   * 
   * Example:
   * ```javascript
   * client.heartbeatStrategy = TickerStrategy.Worker;
   * ```
   */
  public heartbeatStrategy: TickerStrategy = TickerStrategy.Interval;

  /**
   * Enables splitting of large text WebSocket frames into smaller chunks.
   *
   * This setting is enabled for brokers that support only chunked messages (e.g., Java Spring-based brokers).
   * Default is `false`.
   *
   * Warning:
   * - Should not be used with WebSocket-compliant brokers, as chunking may cause large message failures.
   * - Binary WebSocket frames are never split.
   *
   * Example:
   * ```javascript
   * client.splitLargeFrames = true;
   * client.maxWebSocketChunkSize = 4096; // Allow chunks of 4 KB
   * ```
   */
  public splitLargeFrames: boolean = false;

  /**
   * Maximum size (in bytes) for individual WebSocket chunks if [splitLargeFrames]{@link Client#splitLargeFrames} is enabled.
   *
   * Default is 8 KB (`8 * 1024` bytes). This value has no effect if [splitLargeFrames]{@link Client#splitLargeFrames} is `false`.
   */
  public maxWebSocketChunkSize: number = 8 * 1024;

  /**
   * Forces all WebSocket frames to use binary transport, irrespective of payload type.
   *
   * Default behavior determines frame type based on payload (e.g., binary data for ArrayBuffers).
   *
   * Example:
   * ```javascript
   * client.forceBinaryWSFrames = true;
   * ```
   */
  public forceBinaryWSFrames: boolean = false;

  /**
   * Workaround for a React Native WebSocket bug, where messages containing `NULL` are chopped.
   *
   * Enabling this appends a `NULL` character to incoming frames to ensure they remain valid STOMP packets.
   *
   * Warning:
   * - For brokers that split large messages, this may cause data loss or connection termination.
   *
   * Example:
   * ```javascript
   * client.appendMissingNULLonIncoming = true;
   * ```
   */
  public appendMissingNULLonIncoming: boolean = false;

  /**
   * Provides access to the underlying WebSocket instance.
   * This property is **read-only**.
   *
   * Example:
   * ```javascript
   * const webSocket = client.webSocket;
   * if (webSocket) {
   *   console.log('WebSocket is connected:', webSocket.readyState === WebSocket.OPEN);
   * }
   * ```
   *
   * **Caution:**
   * Directly interacting with the WebSocket instance (e.g., sending or receiving frames)
   * can interfere with the proper functioning of this library. Such actions may cause
   * unexpected behavior, disconnections, or invalid state in the library's internal mechanisms.
   *
   * Instead, use the library's provided methods to manage STOMP communication.
   *
   * @returns The WebSocket instance used by the STOMP handler, or `undefined` if not connected.
   */
  get webSocket(): IStompSocket | undefined {
    return this._stompHandler?._webSocket;
  }

  /**
   * Connection headers to be sent during the connection handshake.
   *
   * Keys like `login`, `passcode`, and `host` are commonly expected for most brokers.
   * Although STOMP 1.2 specifies these keys as mandatory, consult your broker's documentation
   * for additional requirements or alternative header usage.
   *
   * Example:
   * ```javascript
   * client.connectHeaders = {
   *   login: 'my-username',
   *   passcode: 'my-password',
   *   host: 'my-vhost'
   * };
   * ```
   */
  public connectHeaders: StompHeaders;

  /**
   * Allows customization of the disconnection headers.
   *
   * Any changes made during an active session will also be applied immediately.
   *
   * Example:
   * ```javascript
   * client.disconnectHeaders = {
   *   receipt: 'custom-receipt-id'
   * };
   * ```
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
   * Callback invoked for any unhandled messages received from the broker.
   *
   * This is particularly useful for handling messages sent to RabbitMQ temporary queues
   * or other queues where no explicit subscription exists. It can also be triggered
   * by stray messages received while a subscription is being unsubscribed.
   *
   * Usage:
   * ```javascript
   * client.onUnhandledMessage = (message) => {
   *   console.log('Unhandled message:', message);
   * };
   * ```
   *
   * @param message The actual {@link IMessage} received.
   */
  public onUnhandledMessage: messageCallbackType;

  /**
   * Callback invoked when the broker sends a receipt indicating the completion
   * of an operation. Receipts are typically requested using the
   * [Client#watchForReceipt]{@link Client#watchForReceipt} function.
   *
   * Usage Example:
   * See [Client#watchForReceipt]{@link Client#watchForReceipt}.
   *
   * @param frame The actual {@link IFrame} received from the broker.
   */
  public onUnhandledReceipt: frameCallbackType;

  /**
   * Callback invoked when a frame of an unknown or unexpected type is received
   * from the broker.
   *
   * This is intended as a fallback for handling unexpected or unsupported frames
   * sent by the broker.
   *
   * Usage:
   * ```javascript
   * client.onUnhandledFrame = (frame) => {
   *   console.warn('Unhandled frame received:', frame);
   * };
   * ```
   *
   * @param frame The actual {@link IFrame} received from the broker.
   */
  public onUnhandledFrame: frameCallbackType;

  /**
   * Callback invoked when a heartbeat message is received from the STOMP broker.
   *
   * Heartbeats ensure that the connection remains active and responsive. This callback
   * is executed on every received heartbeat. It is useful for monitoring connection health
   * or logging heartbeat activity.
   *
   * **Note**: The library handles heartbeats internally to maintain and verify connection status.
   * Implementing this callback is optional and primarily for custom monitoring or debugging.
   *
   * Usage:
   * ```javascript
   * client.onHeartbeatReceived = () => {
   *   console.log('Heartbeat received');
   * };
   * ```
   */
  public onHeartbeatReceived: emptyCallbackType;

  /**
   * Callback invoked when no heartbeat is received from the broker within
   * the acceptable interval, indicating a potential communication issue or connection failure.
   *
   * This callback is triggered when the heartbeat interval defined by `heartbeatIncoming`
   * elapses without a received heartbeat.
   *
   * **Note**: The library handles this condition internally and takes appropriate
   * actions, such as marking the connection as failed. This callback is available
   * for implementing custom recovery strategies or additional notifications.
   *
   * Usage:
   * ```javascript
   * client.onHeartbeatLost = () => {
   *   console.error('Lost connection to the broker');
   * };
   * ```
   */
  public onHeartbeatLost: emptyCallbackType;

  /**
   * Indicates whether there is an active connection to the STOMP broker.
   *
   * Usage:
   * ```javascript
   * if (client.connected) {
   *   console.log('Client is connected to the broker.');
   * } else {
   *   console.log('No connection to the broker.');
   * }
   * ```
   *
   * @returns `true` if the client is currently connected, `false` otherwise.
   */
  get connected(): boolean {
    return !!this._stompHandler && this._stompHandler.connected;
  }

  /**
   * Callback executed before initiating a connection to the STOMP broker.
   *
   * This callback allows users to modify connection options dynamically,
   * such as updating credentials or connection parameters, before the connection is made.
   *
   * As of version 5.1, this callback supports `async/await`, enabling seamless integration
   * with asynchronous operations, such as fetching tokens or credentials.
   *
   * Example:
   * ```javascript
   * client.beforeConnect = async () => {
   *   const token = await fetchToken();
   *   client.connectHeaders = { Authorization: `Bearer ${token}` };
   * };
   * ```
   */
  public beforeConnect: (client: Client) => void | Promise<void>;

  /**
   * Callback executed upon every successful connection to the STOMP broker.
   *
   * This callback is invoked after the connection is established and the CONNECTED frame
   * is received from the broker. It provides access to the broker's response frame,
   * allowing users to parse its headers or other data.
   *
   * Example:
   * ```javascript
   * client.onConnect = (frame) => {
   *   console.log('Connected to broker, session ID:', frame.headers['session']);
   * };
   * ```
   */
  public onConnect: frameCallbackType;

  /**
   * Callback executed upon successful disconnection from the STOMP broker.
   *
   * The callback is invoked when the DISCONNECT receipt is received from the broker.
   * Note that due to the design of the STOMP protocol or communication interrupts, the
   * DISCONNECT receipt may not always be received. For handling such cases, use
   * [Client#onWebSocketClose]{@link Client#onWebSocketClose}.
   *
   * Example:
   * ```javascript
   * client.onDisconnect = (frame) => {
   *   console.log('Disconnected successfully');
   * };
   * ```
   */
  public onDisconnect: frameCallbackType;

  /**
   * Callback executed when an ERROR frame is received from the STOMP broker.
   *
   * Receiving an ERROR frame typically indicates a problem with the subscription,
   * message format, or protocol violation. The broker will usually close the connection
   * after sending an ERROR frame.
   *
   * Example:
   * ```javascript
   * client.onStompError = (frame) => {
   *   console.error('Broker reported an error:', frame.body);
   * };
   * ```
   */
  public onStompError: frameCallbackType;

  /**
   * Callback executed when the underlying WebSocket is closed.
   *
   * This can occur due to various reasons, such as network interruptions or broker shutdown.
   * The callback provides the WebSocket [CloseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent},
   * which contains details about the closure.
   *
   * Example:
   * ```javascript
   * client.onWebSocketClose = (event) => {
   *   console.log('WebSocket closed. Code:', event.code);
   * };
   * ```
   */
  public onWebSocketClose: closeEventCallbackType;

  /**
   * Callback executed when the underlying WebSocket raises an error.
   *
   * This callback provides an [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
   * representing the error raised by the WebSocket.
   *
   * Example:
   * ```javascript
   * client.onWebSocketError = (event) => {
   *   console.error('WebSocket error:', event);
   * };
   * ```
   */
  public onWebSocketError: wsErrorCallbackType;

  /**
   * Enable or disable logging of the raw communication with the broker.
   *
   * When enabled, it logs the raw frames exchanged with the broker. If disabled,
   * only the headers of the parsed frames will be logged.
   *
   * **Caution**: Raw communication frames must contain valid UTF-8 strings,
   * as any non-compliant data can cause errors in the logging process.
   *
   * Changes to this setting will take effect during the next broker reconnect.
   *
   * Example:
   * ```javascript
   * client.logRawCommunication = true; // Enable logging raw communication
   * ```
   */
  public logRawCommunication: boolean;

  /**
   * Set a custom debug function to capture debug messages.
   *
   * By default, debug messages are discarded. To log messages to the console, you can use:
   * ```javascript
   * client.debug = (str) => {
   *   console.log(str);
   * };
   * ```
   *
   * **Note**: This method does not support configurable log levels, and the output can be
   * verbose. Be cautious as debug messages may contain sensitive information, such as
   * credentials or tokens.
   */
  public debug: debugFnType;

  /**
   * Instruct the library to immediately terminate the socket on communication failures, even
   * before the WebSocket is completely closed.
   *
   * This is particularly useful in browser environments where WebSocket closure may get delayed,
   * causing prolonged reconnection intervals under certain failure conditions.
   *
   *
   * Example:
   * ```javascript
   * client.discardWebsocketOnCommFailure = true; // Enable aggressive closing of WebSocket
   * ```
   *
   * Default value: `false`.
   */
  public discardWebsocketOnCommFailure: boolean = false;

  /**
   * The version of the STOMP protocol negotiated with the server during connection.
   *
   * This is a **read-only** property and reflects the negotiated protocol version after
   * a successful connection.
   *
   * Example:
   * ```javascript
   * console.log('Connected STOMP version:', client.connectedVersion);
   * ```
   *
   * @returns The negotiated STOMP protocol version or `undefined` if not connected.
   */
  get connectedVersion(): string | undefined {
    return this._stompHandler ? this._stompHandler.connectedVersion : undefined;
  }

  private _stompHandler: StompHandler | undefined;

  /**
   * Indicates whether the client is currently active.
   *
   * A client is considered active if it is connected or actively attempting to reconnect.
   *
   * Example:
   * ```javascript
   * if (client.active) {
   *   console.log('The client is active.');
   * } else {
   *   console.log('The client is inactive.');
   * }
   * ```
   *
   * @returns `true` if the client is active, otherwise `false`.
   */
  get active(): boolean {
    return this.state === ActivationState.ACTIVE;
  }

  /**
   * Callback invoked whenever the client's state changes.
   *
   * This callback can be used to monitor transitions between various states, such as `ACTIVE`,
   * `INACTIVE`, or `DEACTIVATING`. Note that in some scenarios, the client may transition
   * directly from `ACTIVE` to `INACTIVE` without entering the `DEACTIVATING` state.
   *
   * Example:
   * ```javascript
   * client.onChangeState = (state) => {
   *   console.log(`Client state changed to: ${state}`);
   * };
   * ```
   */
  public onChangeState: (state: ActivationState) => void;

  private _changeState(state: ActivationState) {
    this.state = state;
    this.onChangeState(state);
  }

  /**
   * Current activation state of the client.
   *
   * Possible states:
   * - `ActivationState.ACTIVE`: Client is connected or actively attempting to connect.
   * - `ActivationState.INACTIVE`: Client is disconnected and not attempting to reconnect.
   * - `ActivationState.DEACTIVATING`: Client is in the process of disconnecting.
   *
   * Note: The client may transition directly from `ACTIVE` to `INACTIVE` without entering
   * the `DEACTIVATING` state.
   */
  public state: ActivationState = ActivationState.INACTIVE;

  private _reconnector: any;

  /**
   * Constructs a new STOMP client instance.
   *
   * The constructor initializes default values and sets up no-op callbacks for all events.
   * Configuration can be passed during construction, or updated later using `configure`.
   *
   * Example:
   * ```javascript
   * const client = new Client({
   *   brokerURL: 'wss://broker.example.com',
   *   reconnectDelay: 5000
   * });
   * ```
   *
   * @param conf Optional configuration object to initialize the client with.
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
    this.onHeartbeatReceived = noOp;
    this.onHeartbeatLost = noOp;
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
   * Updates the client's configuration.
   *
   * All properties in the provided configuration object will override the current settings.
   *
   * Additionally, a warning is logged if `maxReconnectDelay` is configured to a
   * value lower than `reconnectDelay`, and `maxReconnectDelay` is adjusted to match `reconnectDelay`.
   *
   * Example:
   * ```javascript
   * client.configure({
   *   reconnectDelay: 3000,
   *   maxReconnectDelay: 10000
   * });
   * ```
   *
   * @param conf Configuration object containing the new settings.
   */

  public configure(conf: StompConfig): void {
    // bulk assign all properties to this
    (Object as any).assign(this, conf);

    // Warn on incorrect maxReconnectDelay settings
    if (
      this.maxReconnectDelay > 0 &&
      this.maxReconnectDelay < this.reconnectDelay
    ) {
      this.debug(
        `Warning: maxReconnectDelay (${this.maxReconnectDelay}ms) is less than reconnectDelay (${this.reconnectDelay}ms). Using reconnectDelay as the maxReconnectDelay delay.`,
      );
      this.maxReconnectDelay = this.reconnectDelay;
    }
  }

  /**
   * Activates the client, initiating a connection to the STOMP broker.
   *
   * On activation, the client attempts to connect and sets its state to `ACTIVE`. If the connection
   * is lost, it will automatically retry based on `reconnectDelay` or `maxReconnectDelay`. If
   * `reconnectTimeMode` is set to `EXPONENTIAL`, the reconnect delay increases exponentially.
   *
   * To stop reconnection attempts and disconnect, call [Client#deactivate]{@link Client#deactivate}.
   *
   * Example:
   * ```javascript
   * client.activate(); // Connect to the broker
   * ```
   *
   * If the client is currently `DEACTIVATING`, connection is delayed until the deactivation process completes.
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
    await this.beforeConnect(this);

    if (this._stompHandler) {
      this.debug(
        'There is already a stompHandler, skipping the call to connect',
      );
      return;
    }

    if (!this.active) {
      this.debug(
        'Client has been marked inactive, will not attempt to connect',
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
          `Connection not established in ${this.connectionTimeout}ms, closing socket`,
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
      heartbeatGracePeriods: this.heartbeatToleranceMultiplier,
      heartbeatOutgoing: this.heartbeatOutgoing,
      heartbeatStrategy: this.heartbeatStrategy,
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

        // Reset reconnect delay after successful connection
        this._nextReconnectDelay = this.reconnectDelay;

        if (!this.active) {
          this.debug(
            'STOMP got connected while deactivate was issued, will disconnect now',
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
      onHeartbeatReceived: () => {
        this.onHeartbeatReceived();
      },
      onHeartbeatLost: () => {
        this.onHeartbeatLost();
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
        this.stompVersions.protocolVersions(),
      );
    } else {
      throw new Error('Either brokerURL or webSocketFactory must be provided');
    }
    webSocket.binaryType = 'arraybuffer';
    return webSocket;
  }

  private _schedule_reconnect(): void {
    if (this._nextReconnectDelay > 0) {
      this.debug(
        `STOMP: scheduling reconnection in ${this._nextReconnectDelay}ms`,
      );

      this._reconnector = setTimeout(() => {
        if (this.reconnectTimeMode === ReconnectionTimeMode.EXPONENTIAL) {
          this._nextReconnectDelay = this._nextReconnectDelay * 2;

          // Truncated exponential backoff with a set limit unless disabled
          if (this.maxReconnectDelay !== 0) {
            this._nextReconnectDelay = Math.min(
              this._nextReconnectDelay,
              this.maxReconnectDelay,
            );
          }
        }

        this._connect();
      }, this._nextReconnectDelay);
    }
  }

  /**
   * Disconnects the client and stops the automatic reconnection loop.
   *
   * If there is an active STOMP connection at the time of invocation, the appropriate callbacks
   * will be triggered during the shutdown sequence. Once deactivated, the client will enter the
   * `INACTIVE` state, and no further reconnection attempts will be made.
   *
   * **Behavior**:
   * - If there is no active WebSocket connection, this method resolves immediately.
   * - If there is an active connection, the method waits for the underlying WebSocket
   *   to properly close before resolving.
   * - Multiple calls to this method are safe. Each invocation resolves upon completion.
   * - To reactivate, call [Client#activate]{@link Client#activate}.
   *
   * **Experimental Option:**
   * - By specifying the `force: true` option, the WebSocket connection is discarded immediately,
   *   bypassing both the STOMP and WebSocket shutdown sequences.
   * - **Caution:** Using `force: true` may leave the WebSocket in an inconsistent state,
   *   and brokers may not immediately detect the termination.
   *
   * Example:
   * ```javascript
   * // Graceful disconnect
   * await client.deactivate();
   *
   * // Forced disconnect to speed up shutdown when the connection is stale
   * await client.deactivate({ force: true });
   * ```
   *
   * @param options Configuration options for deactivation. Use `force: true` for immediate shutdown.
   * @returns A Promise that resolves when the deactivation process completes.
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

    // Clear reconnection timer just to be safe
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
   * Forces a disconnect by directly closing the WebSocket.
   *
   * Unlike a normal disconnect, this does not send a DISCONNECT sequence to the broker but
   * instead closes the WebSocket connection directly. After forcing a disconnect, the client
   * will automatically attempt to reconnect based on its `reconnectDelay` configuration.
   *
   * **Note:** To prevent further reconnect attempts, call [Client#deactivate]{@link Client#deactivate}.
   *
   * Example:
   * ```javascript
   * client.forceDisconnect();
   * ```
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
   * Sends a message to the specified destination on the STOMP broker.
   *
   * The `body` must be a `string`. For non-string payloads (e.g., JSON), encode it as a string before sending.
   * If sending binary data, use the `binaryBody` parameter as a [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
   *
   * **Content-Length Behavior**:
   * - For non-binary messages, the `content-length` header is added by default.
   * - The `content-length` header can be skipped for text frames by setting `skipContentLengthHeader: true` in the parameters.
   * - For binary messages, the `content-length` header is always included.
   *
   * **Notes**:
   * - Ensure that brokers support binary frames before using `binaryBody`.
   * - Sending messages with NULL octets and missing `content-length` headers can cause brokers to disconnect and throw errors.
   *
   * Example:
   * ```javascript
   * // Basic text message
   * client.publish({ destination: "/queue/test", body: "Hello, STOMP" });
   *
   * // Text message with additional headers
   * client.publish({ destination: "/queue/test", headers: { priority: 9 }, body: "Hello, STOMP" });
   *
   * // Skip content-length header
   * client.publish({ destination: "/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true });
   *
   * // Binary message
   * const binaryData = new Uint8Array([1, 2, 3, 4]);
   * client.publish({
   *   destination: '/topic/special',
   *   binaryBody: binaryData,
   *   headers: { 'content-type': 'application/octet-stream' }
   * });
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
   * Monitors for a receipt acknowledgment from the broker for specific operations.
   *
   * Add a `receipt` header to the operation (like subscribe or publish), and use this method with
   * the same receipt ID to detect when the broker has acknowledged the operation's completion.
   *
   * The callback is invoked with the corresponding {@link IFrame} when the receipt is received.
   *
   * Example:
   * ```javascript
   * const receiptId = "unique-receipt-id";
   *
   * client.watchForReceipt(receiptId, (frame) => {
   *   console.log("Operation acknowledged by the broker:", frame);
   * });
   *
   * // Attach the receipt header to an operation
   * client.publish({ destination: "/queue/test", headers: { receipt: receiptId }, body: "Hello" });
   * ```
   *
   * @param receiptId Unique identifier for the receipt.
   * @param callback Callback function invoked on receiving the RECEIPT frame.
   */
  public watchForReceipt(receiptId: string, callback: frameCallbackType): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.watchForReceipt(receiptId, callback);
  }

  /**
   * Subscribes to a destination on the STOMP broker.
   *
   * The callback is triggered for each message received from the subscribed destination. The message
   * is passed as an {@link IMessage} instance.
   *
   * **Subscription ID**:
   * - If no `id` is provided in `headers`, the library generates a unique subscription ID automatically.
   * - Provide an explicit `id` in `headers` if you wish to manage the subscription ID manually.
   *
   * Example:
   * ```javascript
   * const callback = (message) => {
   *   console.log("Received message:", message.body);
   * };
   *
   * // Auto-generated subscription ID
   * const subscription = client.subscribe("/queue/test", callback);
   *
   * // Explicit subscription ID
   * const mySubId = "my-subscription-id";
   * const subscription = client.subscribe("/queue/test", callback, { id: mySubId });
   * ```
   *
   * @param destination Destination to subscribe to.
   * @param callback Function invoked for each received message.
   * @param headers Optional headers for subscription, such as `id`.
   * @returns A {@link StompSubscription} which can be used to manage the subscription.
   */
  public subscribe(
    destination: string,
    callback: messageCallbackType,
    headers: StompHeaders = {},
  ): StompSubscription {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    return this._stompHandler.subscribe(destination, callback, headers);
  }

  /**
   * Unsubscribes from a subscription on the STOMP broker.
   *
   * Prefer using the `unsubscribe` method directly on the {@link StompSubscription} returned from `subscribe` for cleaner management:
   * ```javascript
   * const subscription = client.subscribe("/queue/test", callback);
   * // Unsubscribe using the subscription object
   * subscription.unsubscribe();
   * ```
   *
   * This method can also be used directly with the subscription ID.
   *
   * Example:
   * ```javascript
   * client.unsubscribe("my-subscription-id");
   * ```
   *
   * @param id Subscription ID to unsubscribe.
   * @param headers Optional headers to pass for the UNSUBSCRIBE frame.
   */
  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.unsubscribe(id, headers);
  }

  /**
   * Starts a new transaction. The returned {@link ITransaction} object provides
   * methods for [commit]{@link ITransaction#commit} and [abort]{@link ITransaction#abort}.
   *
   * If `transactionId` is not provided, the library generates a unique ID internally.
   *
   * Example:
   * ```javascript
   * const tx = client.begin(); // Auto-generated ID
   *
   * // Or explicitly specify a transaction ID
   * const tx = client.begin("my-transaction-id");
   * ```
   *
   * @param transactionId Optional transaction ID.
   * @returns An instance of {@link ITransaction}.
   */
  public begin(transactionId?: string): ITransaction {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    return this._stompHandler.begin(transactionId);
  }

  /**
   * Commits a transaction.
   * 
   * It is strongly recommended to call [commit]{@link ITransaction#commit} on
   * the transaction object returned by [client#begin]{@link Client#begin}.
   * 
   * Example:
   * ```javascript
   * const tx = client.begin();
   * // Perform operations under this transaction
   * tx.commit();
   * ```
   * 
   * @param transactionId The ID of the transaction to commit.
   */
  public commit(transactionId: string): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.commit(transactionId);
  }

  /**
   * Aborts a transaction.
   * 
   * It is strongly recommended to call [abort]{@link ITransaction#abort} directly
   * on the transaction object returned by [client#begin]{@link Client#begin}.
   * 
   * Example:
   * ```javascript
   * const tx = client.begin();
   * // Perform operations under this transaction
   * tx.abort(); // Abort the transaction
   * ```
   * 
   * @param transactionId The ID of the transaction to abort.
   */
  public abort(transactionId: string): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.abort(transactionId);
  }

  /**
   * Acknowledges receipt of a message. Typically, this should be done by calling
   * [ack]{@link IMessage#ack} directly on the {@link IMessage} instance passed
   * to the subscription callback.
   * 
   * Example:
   * ```javascript
   * const callback = (message) => {
   *   // Process the message
   *   message.ack(); // Acknowledge the message
   * };
   * 
   * client.subscribe("/queue/example", callback, { ack: "client" });
   * ```
   * 
   * @param messageId The ID of the message to acknowledge.
   * @param subscriptionId The ID of the subscription.
   * @param headers Optional headers for the acknowledgment frame.
   */
  public ack(
    messageId: string,
    subscriptionId: string,
    headers: StompHeaders = {},
  ): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.ack(messageId, subscriptionId, headers);
  }

  /**
   * Rejects a message (negative acknowledgment). Like acknowledgments, this should
   * typically be done by calling [nack]{@link IMessage#nack} directly on the {@link IMessage}
   * instance passed to the subscription callback.
   * 
   * Example:
   * ```javascript
   * const callback = (message) => {
   *   // Process the message
   *   if (isError(message)) {
   *     message.nack(); // Reject the message
   *   }
   * };
   * 
   * client.subscribe("/queue/example", callback, { ack: "client" });
   * ```
   * 
   * @param messageId The ID of the message to negatively acknowledge.
   * @param subscriptionId The ID of the subscription.
   * @param headers Optional headers for the NACK frame.
   */
  public nack(
    messageId: string,
    subscriptionId: string,
    headers: StompHeaders = {},
  ): void {
    this._checkConnection();
    // @ts-ignore - we already checked that there is a _stompHandler, and it is connected
    this._stompHandler.nack(messageId, subscriptionId, headers);
  }
}
