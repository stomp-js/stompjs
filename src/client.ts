import {Frame} from "./frame";
import {Stomp} from "./compatibility/stomp";
import {Byte} from "./byte";
import {StompHeaders} from "./stomp-headers";
import {Message} from "./message";
import {StompSubscription} from "./stomp-subscription";
import {Transaction} from "./transaction";
import {Versions} from "./versions";
import {frameCallbackType, messageCallbackType} from "./types";

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
  public reconnectDelay: number;

  /**
   * Incoming heartbeat interval in milliseconds. Set to 0 to disable
   */
  public heartbeatIncoming: number;

  /**
   * Outgoing heartbeat interval in milliseconds. Set to 0 to disable
   */
  public heartbeatOutgoing: number;

  // public heartbeat: { outgoing: number; incoming: number };

  /**
   * Packet sizes above these will be split
   */
  public maxWebSocketFrameSize: number;

  /**
   * Underlying WebSocket instance, READONLY
   */
  get webSocket(): any {
    return this._webSocket;
  }
  protected _webSocket: any;

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
    return this._connected;
  }
  private _connected: boolean;

  /**
   * Callback
   */
  public onConnect: frameCallbackType;

  /**
   * Callback
   */
  public onDisconnect: frameCallbackType;

  /**
   * Callback
   */
  public onStompError: any;

  /**
   * Callback
   */
  public onWebSocketClose: any;

  /**
   * version of STOMP protocol negotiated with the server, READONLY
   */
  get version(): string {
    return this._version;
  }
  private _version: string;

  private _subscriptions: any;
  private _partialData: string;
  private _escapeHeaderValues: boolean;
  private _counter: number;
  private _pinger: any;
  private _ponger: any;
  private _lastServerActivityTS: number;
  private _active: boolean = false;
  private _closeReceipt: string;
  private _reconnector: any;

  /**
   * Please do not create instance of this class directly, use one of the methods [Stomp.client]{@link Stomp#client},
   * [Stomp.over]{@link Stomp#over} in {@link Stomp}.
   */
  constructor() {
    // Dummy callbacks
    const noOp = () => {};
    this.onConnect = noOp;
    this.onDisconnect = noOp;
    this.onUnhandledMessage = noOp;
    this.onReceipt = noOp;

    // Default values for important parameters

    // No auto reconnection
    this.reconnectDelay = 0;

    // send heartbeat every 10s by default (value is in ms)
    this.heartbeatOutgoing = 10000;
    // expect to receive server heartbeat at least every 10s by default
    // (value in ms)
    this.heartbeatIncoming = 10000;

    // maximum *WebSocket* frame size sent by the client. If the STOMP frame
    // is bigger than this value, the STOMP frame will be sent using multiple
    // WebSocket frames (default is 16KiB)
    this.maxWebSocketFrameSize = 16 * 1024;

    // These parameters would typically get proper values before connect is called
    this.connectHeaders = {};
    this.disconnectHeaders = {};
    this.webSocketFactory = () => null;

    // Internal fields

    // used to index subscribers
    this._counter = 0;

    // current connection state
    this._connected = false;

    // subscription callbacks indexed by subscriber's ID
    this._subscriptions = {};

    this._partialData = '';

    this._closeReceipt = '';

    this._version  = '';

    this._escapeHeaderValues = false;

    this._lastServerActivityTS = Date.now();
  }

  /**
   * By default, debug messages are logged in the window's console if it is defined.
   * This method is called for every actual transmission of the STOMP frames over the
   * WebSocket.
   *
   * It is possible to set a `debug(message)` method
   * on a client instance to handle differently the debug messages:
   *
   * ```javascript
   *        client.debug = function(str) {
   *          // append the debug log to a #debug div
   *          $("#debug").append(str + "\n");
   *        };
   *
   *        // Disable logging
   *        client.debug = function(str) {};
   * ```
   *
   * Note: the default can generate lot of log on the console. Set it to empty function to disable.
   */
  public debug = (...message: any[]) => {
    console.log(...message);
  };

  private _transmit(command: string, headers: StompHeaders, body: string = ''): void {
    let out = Frame.marshall(command, headers, body, this._escapeHeaderValues);
    this.debug(`>>> ${out}`);
    // if necessary, split the *STOMP* frame to send it on many smaller
    // *WebSocket* frames
    while (true) {
      if (out.length > this.maxWebSocketFrameSize) {
        this._webSocket.send(out.substring(0, this.maxWebSocketFrameSize));
        out = out.substring(this.maxWebSocketFrameSize);
        this.debug(`remaining = ${out.length}`);
      } else {
        this._webSocket.send(out);
        return;
      }
    }
  }

  private _setupHeartbeat(headers: StompHeaders): void {
    let ttl: number;
    if ((headers.version !== Versions.V1_1 && headers.version !== Versions.V1_2)) {
      return;
    }

    // heart-beat header received from the server looks like:
    //
    //     heart-beat: sx, sy
    const [serverOutgoing, serverIncoming] = (<string>headers['heart-beat']).split(",").map((v: string) => parseInt(v));

    if ((this.heartbeatOutgoing !== 0) && (serverIncoming !== 0)) {
      ttl = Math.max(this.heartbeatOutgoing, serverIncoming);
      this.debug(`send PING every ${ttl}ms`);
      this._pinger = setInterval(() => {
        this._webSocket.send(Byte.LF);
        this.debug(">>> PING");
      }, ttl);
    }

    if ((this.heartbeatIncoming !== 0) && (serverOutgoing !== 0)) {
      ttl = Math.max(this.heartbeatIncoming, serverOutgoing);
      this.debug(`check PONG every ${ttl}ms`);
      this._ponger = setInterval(() => {
        const delta = Date.now() - this._lastServerActivityTS;
        // We wait twice the TTL to be flexible on window's setInterval calls
        if (delta > (ttl * 2)) {
          this.debug(`did not receive server activity for the last ${delta}ms`);
          this._webSocket.close();
        }
      }, ttl);
    }
  }

  /**
   * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
   * version with headers to pass your broker specific options.
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
  public connect(): void {
    this._escapeHeaderValues = false;

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

    this._webSocket.onmessage = (evt: any) => {
      this.debug('Received data');
      const data = (() => {
        if ((typeof(ArrayBuffer) !== 'undefined') && evt.data instanceof ArrayBuffer) {
          // the data is stored inside an ArrayBuffer, we decode it to get the
          // data as a String
          const arr = new Uint8Array(evt.data);
          this.debug(`--- got data length: ${arr.length}`);
          // Return a string formed by all the char codes stored in the Uint8array
          let j, len1, results;
          results = [];
          for (j = 0, len1 = arr.length; j < len1; j++) {
            const c = arr[j];
            results.push(String.fromCharCode(c));
          }

          return results.join('');
        } else {
          // take the data directly from the WebSocket `data` field
          return evt.data;
        }
      })();
      this.debug(data);
      this._lastServerActivityTS = Date.now();
      if (data === Byte.LF) { // heartbeat
        this.debug("<<< PONG");
        return;
      }
      this.debug(`<<< ${data}`);
      // Handle STOMP frames received from the server
      // The unmarshall function returns the frames parsed and any remaining
      // data from partial frames.
      const unmarshalledData = Frame.unmarshall(this._partialData + data, this._escapeHeaderValues);
      this._partialData = unmarshalledData.partial;
      for (let frame of unmarshalledData.frames) {
        switch (frame.command) {
          // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
          case "CONNECTED":
            this.debug(`connected to server ${frame.headers.server}`);
            this._connected = true;
            this._version = <string>frame.headers.version;
            // STOMP version 1.2 needs header values to be escaped
            if (this._version === Versions.V1_2) {
              this._escapeHeaderValues = true;
            }

            // If a disconnect was requested while I was connecting, issue a disconnect
            if (!this._active) {
              this.disconnect();
              return;
            }

            this._setupHeartbeat(frame.headers);
            if (typeof this.onConnect === 'function') {
              this.onConnect(frame);
            }
            break;
          // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
          case "MESSAGE":
            // the `onreceive` callback is registered when the client calls
            // `subscribe()`.
            // If there is registered subscription for the received message,
            // we used the default `onreceive` method that the client can set.
            // This is useful for subscriptions that are automatically created
            // on the browser side (e.g. [RabbitMQ's temporary
            // queues](http://www.rabbitmq.com/stomp.html)).
            const subscription = <string>frame.headers.subscription;
            const onreceive = this._subscriptions[subscription] || this.onUnhandledMessage;
            // bless the frame to be a Message
            const message = <Message>frame;
            if (onreceive) {
              let messageId: string;
              const client = this;
              if (this._version === Versions.V1_2) {
                messageId = <string>message.headers["ack"];
              } else {
                messageId = <string>message.headers["message-id"];
              }
              // add `ack()` and `nack()` methods directly to the returned frame
              // so that a simple call to `message.ack()` can acknowledge the message.
              message.ack = (headers: StompHeaders = {}): void => {
                return client.ack(messageId, subscription, headers);
              };
              message.nack = (headers: StompHeaders = {}): void => {
                return client.nack(messageId, subscription, headers);
              };
              onreceive(message);
            } else {
              this.debug(`Unhandled received MESSAGE: ${message}`);
            }
            break;
          // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
          //
          // The client instance can set its `onreceipt` field to a function taking
          // a frame argument that will be called when a receipt is received from
          // the server:
          //
          //     client.onreceipt = function(frame) {
          //       receiptID = frame.headers['receipt-id'];
          //       ...
          //     }
          case "RECEIPT":
            // if this is the receipt for a DISCONNECT, close the websocket
            if (frame.headers["receipt-id"] === this._closeReceipt) {
              // Discard the onclose callback to avoid calling the errorCallback when
              // the client is properly disconnected.
              this._webSocket.onclose = null;
              this._webSocket.close();
              this._cleanUp();
              if (typeof this.onDisconnect === 'function') {
                this.onDisconnect(frame);
              }
            } else {
              if (typeof this.onReceipt === 'function') {
                this.onReceipt(frame);
              }
            }
            break;
          // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
          case "ERROR":
            if (typeof this.onStompError === 'function') {
              this.onStompError(frame);
            }
            break;
          default:
            this.debug(`Unhandled frame: ${frame}`);
        }
      }
    };

    this._webSocket.onclose = (closeEvent: any): void => {
      const msg = `Whoops! Lost connection to ${this._webSocket.url}`;
      this.debug(msg);
      if (typeof this.onWebSocketClose === 'function') {
        this.onWebSocketClose(closeEvent);
      }
      this._cleanUp();
      if (typeof this.onStompError === 'function') {
        this.onStompError(msg);
      }
      this._schedule_reconnect();
    };

    this._webSocket.onopen = () => {
      this.debug('Web Socket Opened...');
      this.connectHeaders["accept-version"] = Versions.supportedVersions();
      this.connectHeaders["heart-beat"] = [this.heartbeatOutgoing, this.heartbeatIncoming].join(',');
      this._transmit("CONNECT", this.connectHeaders);
    };
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
          if (this._connected) {
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
  public disconnect(): void {
    // indicate that auto reconnect loop should terminate
    this._active = false;

    if (this._connected) {
      if (!this.disconnectHeaders['receipt']) {
        this.disconnectHeaders['receipt'] = `close-${this._counter++}`;
      }
      this._closeReceipt = <string>this.disconnectHeaders['receipt'];
      try {
        this._transmit("DISCONNECT", this.disconnectHeaders);
      } catch (error) {
        this.debug('Ignoring error during disconnect', error);
      }
    }
  }

  private _cleanUp(): void {
    // Clear if a reconnection was scheduled
    if (this._reconnector) {
      clearTimeout(this._reconnector);
    }

    this._connected = false;
    this._subscriptions = {};
    if (this._pinger) {
      clearInterval(this._pinger);
    }
    if (this._ponger) {
      clearInterval(this._ponger);
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
    headers.destination = destination;
    this._transmit("SEND", headers, body);
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
    if (!headers.id) {
      headers.id = `sub-${this._counter++}`;
    }
    headers.destination = destination;
    this._subscriptions[<string>headers.id] = callback;
    this._transmit("SUBSCRIBE", headers);
    const client = this;
    return {
      id: <string>headers.id,

      unsubscribe(hdrs) {
        return client.unsubscribe(<string>headers.id, hdrs);
      }
    };
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
    if (headers == null) {
      headers = {};
    }
    delete this._subscriptions[id];
    headers.id = id;
    this._transmit("UNSUBSCRIBE", headers);
  }

  /**
   * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
   * and [abort]{@link Transaction#abort}.
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#BEGIN BEGIN Frame
   */
  public begin(transactionId: string): Transaction {
    const txId = transactionId || (`tx-${this._counter++}`);
    this._transmit("BEGIN", {
      transaction: txId
    });
    const client = this;
    return {
      id: txId,
      commit(): void {
        client.commit(txId);
      },
      abort(): void {
        client.abort(txId);
      }
    };
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
    this._transmit("COMMIT", {
      transaction: transactionId
    });
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
    this._transmit("ABORT", {
      transaction: transactionId
    });
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
    if (this._version === Versions.V1_2) {
      headers["id"] = messageId;
    } else {
      headers["message-id"] = messageId;
    }
    headers.subscription = subscriptionId;
    this._transmit("ACK", headers);
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
    if (this._version === Versions.V1_2) {
      headers["id"] = messageId;
    } else {
      headers["message-id"] = messageId;
    }
    headers.subscription = subscriptionId;
    return this._transmit("NACK", headers);
  }
}