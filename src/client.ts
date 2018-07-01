import {Frame} from "./frame";
import {Stomp} from "./compatibility/stomp";
import {Byte} from "./byte";
import {StompHeaders} from "./stomp-headers";
import {Message} from "./message";
import {StompSubscription} from "./stomp-subscription";
import {Transaction} from "./transaction";
import {Versions} from "./versions";

type messageCallbackType = (message: Message) => void;
type frameCallbackType = (receipt: Frame) => void;

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
   * outgoing and incoming heartbeat interval in milliseconds. Set to 0 to disable
   */
  public heartbeat: { outgoing: number; incoming: number };

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
   * This function will be called for any unhandled messages. It is useful to receive messages sent to
   * temporary queues (for example RabbitMQ supports such queues).
   *
   * It can also be called for stray messages while the server is processing a request to unsubcribe
   * from an endpoint.
   */
  public onreceive: messageCallbackType|null = null;

  /**
   * STOMP brokers can be requested to notify when an operation is actually completed.
   *
   * TODO: add example
   */
  public onreceipt: frameCallbackType|null = null;

  /**
   * `true` if there is a active connection with STOMP Broker
   */
  public connected: boolean;

  /**
   * Callback
   */
  public onConnect: any;

  /**
   * Callback
   */
  private onDisconnect: any;

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
  public version: string = '';

  private subscriptions: any;
  private _partialData: any;
  private _escapeHeaderValues: boolean = false;
  private _counter: number;
  private _pinger: any;
  private _ponger: any;
  private _lastServerActivityTS: any;
  private _connectHeaders: StompHeaders = {}; // Convert to local variable
  private _active: boolean = false;
  private _closeReceipt: string = '';
  private _reconnector: any;

  private static now(): any {
    if (Date.now) {
      return Date.now();
    } else {
      return new Date().valueOf;
    }
  }

  /**
   * Please do not create instance of this class directly, use one of the methods [Stomp.client]{@link Stomp#client},
   * [Stomp.over]{@link Stomp#over} in {@link Stomp}.
   */
  constructor(ws_fn: () => any) {
    this.webSocketFactory = function () {
      const ws = ws_fn();
      ws.binaryType = "arraybuffer";
      return ws;
    };

    this.reconnectDelay = 0;

    // used to index subscribers
    this._counter = 0;

    // @property [Boolean] current connection state
    this.connected = false;

    // @property [{outgoing: Number, incoming: Number}] outgoing and incoming
    // heartbeat in milliseconds, set to 0 to disable
    this.heartbeat = {
      // send heartbeat every 10s by default (value is in ms)
      outgoing: 10000,
      // expect to receive server heartbeat at least every 10s by default
      // (value in ms)
      incoming: 10000
    };
    // maximum *WebSocket* frame size sent by the client. If the STOMP frame
    // is bigger than this value, the STOMP frame will be sent using multiple
    // WebSocket frames (default is 16KiB)
    this.maxWebSocketFrameSize = 16 * 1024;
    // subscription callbacks indexed by subscriber's ID
    this.subscriptions = {};
    this._partialData = '';
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
    if (typeof this.debug === 'function') {
      this.debug(`>>> ${out}`);
    }
    // if necessary, split the *STOMP* frame to send it on many smaller
    // *WebSocket* frames
    while (true) {
      if (out.length > this.maxWebSocketFrameSize) {
        this._webSocket.send(out.substring(0, this.maxWebSocketFrameSize));
        out = out.substring(this.maxWebSocketFrameSize);
        if (typeof this.debug === 'function') {
          this.debug(`remaining = ${out.length}`);
        }
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

    if ((this.heartbeat.outgoing !== 0) && (serverIncoming !== 0)) {
      ttl = Math.max(this.heartbeat.outgoing, serverIncoming);
      if (typeof this.debug === 'function') {
        this.debug(`send PING every ${ttl}ms`);
      }
      this._pinger = setInterval(() => {
        this._webSocket.send(Byte.LF);
        return (typeof this.debug === 'function' ? this.debug(">>> PING") : undefined);
      }, ttl);
    }

    if ((this.heartbeat.incoming !== 0) && (serverOutgoing !== 0)) {
      ttl = Math.max(this.heartbeat.incoming, serverOutgoing);
      if (typeof this.debug === 'function') {
        this.debug(`check PONG every ${ttl}ms`);
      }
      this._ponger = setInterval(() => {
        const delta = Client.now() - this._lastServerActivityTS;
        // We wait twice the TTL to be flexible on window's setInterval calls
        if (delta > (ttl * 2)) {
          if (typeof this.debug === 'function') {
            this.debug(`did not receive server activity for the last ${delta}ms`);
          }
          return this._webSocket.close();
        }
      }, ttl);
    }
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
    this._escapeHeaderValues = false;
    const out = this._parseConnect(...args);
    [this._connectHeaders, this.onConnect, this.onStompError, this.onWebSocketClose] = out;

    // Indicate that this connection is active (it will keep trying to connect)
    this._active = true;

    this._connect();
  }

  private _connect(): void {
    if (typeof this.debug === 'function') {
      this.debug("Opening Web Socket...");
    }

    // Get the actual Websocket (or a similar object)
    this._webSocket = this.webSocketFactory();

    this._webSocket.onmessage = (evt: any) => {
      this.debug('Received data');
      const data = (() => {
        if ((typeof(ArrayBuffer) !== 'undefined') && evt.data instanceof ArrayBuffer) {
          // the data is stored inside an ArrayBuffer, we decode it to get the
          // data as a String
          const arr = new Uint8Array(evt.data);
          if (typeof this.debug === 'function') {
            this.debug(`--- got data length: ${arr.length}`);
          }
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
      this._lastServerActivityTS = Client.now();
      if (data === Byte.LF) { // heartbeat
        if (typeof this.debug === 'function') {
          this.debug("<<< PONG");
        }
        return;
      }
      if (typeof this.debug === 'function') {
        this.debug(`<<< ${data}`);
      }
      // Handle STOMP frames received from the server
      // The unmarshall function returns the frames parsed and any remaining
      // data from partial frames.
      const unmarshalledData = Frame.unmarshall(this._partialData + data, this._escapeHeaderValues);
      this._partialData = unmarshalledData.partial;
      for (let frame of unmarshalledData.frames) {
        switch (frame.command) {
          // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
          case "CONNECTED":
            if (typeof this.debug === 'function') {
              this.debug(`connected to server ${frame.headers.server}`);
            }
            this.connected = true;
            this.version = <string>frame.headers.version;
            // STOMP version 1.2 needs header values to be escaped
            if (this.version === Versions.V1_2) {
              this._escapeHeaderValues = true;
            }

            // If a disconnect was requested while I was connecting, issue a disconnect
            if (!this._active) {
              // TODO: disconnect callback can no longer be part of disconnect call, it needs to be property of the
              // client
              this.disconnect(() => {
              });
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
            const onreceive = this.subscriptions[subscription] || this.onreceive;
            // bless the frame to be a Message
            const message = <Message>frame;
            if (onreceive) {
              let messageId: string;
              const client = this;
              if (this.version === Versions.V1_2) {
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
              if (typeof this.debug === 'function') {
                this.debug(`Unhandled received MESSAGE: ${message}`);
              }
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
                this.onDisconnect();
              }
            } else {
              if (typeof this.onreceipt === 'function') {
                this.onreceipt(frame);
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
            if (typeof this.debug === 'function') {
              this.debug(`Unhandled frame: ${frame}`);
            }
        }
      }
    };

    this._webSocket.onclose = (closeEvent: any) => {
      const msg = `Whoops! Lost connection to ${this._webSocket.url}`;
      if (typeof this.debug === 'function') {
        this.debug(msg);
      }
      if (typeof this.onWebSocketClose === 'function') {
        this.onWebSocketClose(closeEvent);
      }
      this._cleanUp();
      if (typeof this.onStompError === 'function') {
        this.onStompError(msg);
      }
      return this._schedule_reconnect();
    };

    this._webSocket.onopen = () => {
      if (typeof this.debug === 'function') {
        this.debug('Web Socket Opened...');
      }
      this._connectHeaders["accept-version"] = Versions.supportedVersions();
      this._connectHeaders["heart-beat"] = [this.heartbeat.outgoing, this.heartbeat.incoming].join(',');
      this._transmit("CONNECT", this._connectHeaders);
    };
  }

  private _schedule_reconnect(): any {
    if (this.reconnectDelay > 0) {
      if (typeof this.debug === 'function') {
        this.debug(`STOMP: scheduling reconnection in ${this.reconnectDelay}ms`);
      }
      // setTimeout is available in both Browser and Node.js environments
      return this._reconnector = setTimeout(() => {
          if (this.connected) {
            return (typeof this.debug === 'function' ? this.debug('STOMP: already connected') : undefined);
          } else {
            if (typeof this.debug === 'function') {
              this.debug('STOMP: attempting to reconnect');
            }
            return this._connect();
          }
        }
        , this.reconnectDelay);
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
  public disconnect(disconnectCallback: any, headers: StompHeaders = {}): void {
    this.onDisconnect = disconnectCallback;

    // indicate that auto reconnect loop should terminate
    this._active = false;

    if (this.connected) {
      if (!headers['receipt']) {
        headers['receipt'] = `close-${this._counter++}`;
      }
      this._closeReceipt = <string>headers['receipt'];
      try {
        this._transmit("DISCONNECT", headers);
      } catch (error) {
        (typeof this.debug === 'function' ? this.debug('Ignoring error during disconnect', error) : undefined);
      }
    }
  }

  private _cleanUp(): void {
    // Clear if a reconnection was scheduled
    if (this._reconnector) {
      clearTimeout(this._reconnector);
    }

    this.connected = false;
    this.subscriptions = {};
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
  public send(destination: string, headers: StompHeaders, body: string): void {
    if (headers == null) {
      headers = {};
    }
    if (body == null) {
      body = '';
    }
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
   * @param {string} destination
   * @param {(message: Message) => void} callback
   * @param {StompHeaders} headers
   * @returns {StompSubscription}
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#SUBSCRIBE SUBSCRIBE Frame
   */
  public subscribe(destination: string, callback: messageCallbackType, headers: StompHeaders = {}): StompSubscription {
    if (!headers.id) {
      headers.id = `sub-${this._counter++}`;
    }
    headers.destination = destination;
    this.subscriptions[<string>headers.id] = callback;
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
   * @param {string} id
   * @param {StompHeaders} headers
   *
   * @see http://stomp.github.com/stomp-specification-1.2.html#UNSUBSCRIBE UNSUBSCRIBE Frame
   */
  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    if (headers == null) {
      headers = {};
    }
    delete this.subscriptions[id];
    headers.id = id;
    this._transmit("UNSUBSCRIBE", headers);
  }

  /**
   * Start a transaction, the returned {@link Transaction} has methods - [commit]{@link Transaction#commit}
   * and [abort]{@link Transaction#abort}.
   *
   * @param {string} transactionId
   * @returns {Transaction}
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
   * @param {string} transactionId
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
   * @param {string} transactionId
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
    if (this.version === Versions.V1_2) {
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
    if (this.version === Versions.V1_2) {
      headers["id"] = messageId;
    } else {
      headers["message-id"] = messageId;
    }
    headers.subscription = subscriptionId;
    return this._transmit("NACK", headers);
  }
}