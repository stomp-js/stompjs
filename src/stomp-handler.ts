import {Client} from './client';
import {Byte} from "./byte";
import {Versions} from "./versions";
import {Message} from "./message";
import {Frame} from "./frame";
import {StompHeaders} from "./stomp-headers";
import {closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType, publishParams} from "./types";
import {StompSubscription} from "./stomp-subscription";
import {Transaction} from "./transaction";
import {StompConfig} from "./stomp-config";
import {Parser} from "./parser";

/**
 * The STOMP protocol handler
 *
 * @internal
 */
export class StompHandler {
  public debug: debugFnType;

  public stompVersions: Versions;

  public connectHeaders: StompHeaders;

  public disconnectHeaders: StompHeaders;

  public heartbeatIncoming: number;

  public heartbeatOutgoing: number;

  public onUnhandledMessage: messageCallbackType;

  public onUnhandledReceipt: frameCallbackType;

  public onUnhandledFrame: frameCallbackType;

  public onConnect: frameCallbackType;

  public onDisconnect: frameCallbackType;

  public onStompError: frameCallbackType;

  public onWebSocketClose: closeEventCallbackType;

  get connectedVersion(): string {
    return this._connectedVersion;
  }
  private _connectedVersion: string;

  get connected(): boolean {
    return this._connected;
  }

  private _connected: boolean;

  private readonly _subscriptions: { [key: string]: messageCallbackType };
  private readonly _receiptWatchers: { [key: string]: frameCallbackType };
  private _partialData: string;
  private _escapeHeaderValues: boolean;
  private _counter: number;
  private _pinger: any;
  private _ponger: any;
  private _lastServerActivityTS: number;

  constructor(private _client: Client, private _webSocket: WebSocket, config: StompConfig = {}) {
    // used to index subscribers
    this._counter = 0;

    // subscription callbacks indexed by subscriber's ID
    this._subscriptions = {};

    // receipt-watchers indexed by receipts-ids
    this._receiptWatchers = {};

    this._partialData = '';

    this._escapeHeaderValues = false;

    this._lastServerActivityTS = Date.now();

    this.configure(config);
  }

  public configure(conf: StompConfig): void {
    // bulk assign all properties to this
    (<any>Object).assign(this, conf);
  }

  public start(): void {
    const parser = new Parser(
      // On Frame
      (rawFrame) => {
        const frame = Frame.fromRawFrame(rawFrame, this._escapeHeaderValues);

        this.debug(`<<< ${frame}`);

        const serverFrameHandler = this._serverFrameHandlers[frame.command] || this.onUnhandledFrame;
        serverFrameHandler(frame);
      },
      // On Incoming Ping
      () => {
        this.debug("<<< PONG");
      }
    );

    this._webSocket.onmessage = (evt: any) => {
      this.debug('Received data');
      this._lastServerActivityTS = Date.now();

      parser.parseChunk(evt.data);
    };

    this._webSocket.onclose = (closeEvent: any): void => {
      this.debug(`Connection closed to ${this._webSocket.url}`);
      this.onWebSocketClose(closeEvent);
      this._cleanUp();
    };

    this._webSocket.onopen = () => {
      this.debug('Web Socket Opened...');
      this.connectHeaders["accept-version"] = this.stompVersions.supportedVersions();
      this.connectHeaders["heart-beat"] = [this.heartbeatOutgoing, this.heartbeatIncoming].join(',');
      this._transmit({command: "CONNECT", headers: this.connectHeaders});
    };
  }

  private readonly _serverFrameHandlers: { [key: string]: frameCallbackType } = {

    // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
    'CONNECTED': (frame) => {
      this.debug(`connected to server ${frame.headers.server}`);
      this._connected = true;
      this._connectedVersion = frame.headers.version;
      // STOMP version 1.2 needs header values to be escaped
      if (this._connectedVersion === Versions.V1_2) {
        this._escapeHeaderValues = true;
      }

      this._setupHeartbeat(frame.headers);
      this.onConnect(frame);
    },

    // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
    "MESSAGE": (frame) => {
      // the callback is registered when the client calls
      // `subscribe()`.
      // If there is no registered subscription for the received message,
      // the default `onUnhandledMessage` callback is used that the client can set.
      // This is useful for subscriptions that are automatically created
      // on the browser side (e.g. [RabbitMQ's temporary
      // queues](http://www.rabbitmq.com/stomp.html)).
      const subscription = frame.headers.subscription;
      const onReceive = this._subscriptions[subscription] || this.onUnhandledMessage;

      // bless the frame to be a Message
      const message = <Message>frame;

      const client = this;
      const messageId = this._connectedVersion === Versions.V1_2 ? message.headers["ack"] : message.headers["message-id"];

      // add `ack()` and `nack()` methods directly to the returned frame
      // so that a simple call to `message.ack()` can acknowledge the message.
      message.ack = (headers: StompHeaders = {}): void => {
        return client.ack(messageId, subscription, headers);
      };
      message.nack = (headers: StompHeaders = {}): void => {
        return client.nack(messageId, subscription, headers);
      };
      onReceive(message);
    },

    // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
    "RECEIPT": (frame) => {
      const callback = this._receiptWatchers[frame.headers["receipt-id"]];
      if (callback) {
        callback(frame);
        // Server will acknowledge only once, remove the callback
        delete this._receiptWatchers[frame.headers["receipt-id"]];
      } else {
        this.onUnhandledReceipt(frame);
      }
    },

    // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
    'ERROR': (frame) => {
      this.onStompError(frame);
    }
  };

  private _setupHeartbeat(headers: StompHeaders): void {
    if ((headers.version !== Versions.V1_1 && headers.version !== Versions.V1_2)) {
      return;
    }

    // heart-beat header received from the server looks like:
    //
    //     heart-beat: sx, sy
    const [serverOutgoing, serverIncoming] = (headers['heart-beat']).split(",").map((v: string) => parseInt(v));

    if ((this.heartbeatOutgoing !== 0) && (serverIncoming !== 0)) {
      let ttl: number = Math.max(this.heartbeatOutgoing, serverIncoming);
      this.debug(`send PING every ${ttl}ms`);
      this._pinger = setInterval(() => {
        this._webSocket.send(Byte.LF);
        this.debug(">>> PING");
      }, ttl);
    }

    if ((this.heartbeatIncoming !== 0) && (serverOutgoing !== 0)) {
      let ttl: number = Math.max(this.heartbeatIncoming, serverOutgoing);
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

  private _transmit(params: { command: string, headers?: StompHeaders,
                              body?: string, binaryBody?: Uint8Array, skipContentLengthHeader?: boolean }): void {
    let {command, headers, body, binaryBody, skipContentLengthHeader} = params;
    let frame = new Frame({
      command: command,
      headers: headers,
      body: body,
      binaryBody: binaryBody,
      escapeHeaderValues: this._escapeHeaderValues,
      skipContentLengthHeader: skipContentLengthHeader
    });
    this.debug(`>>> ${frame}`);
    this._webSocket.send(frame.serialize());
/* Do we need this?
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
*/
  }

  public dispose(): void {
    if (this.connected) {
      try {
        if (!this.disconnectHeaders['receipt']) {
          this.disconnectHeaders['receipt'] = `close-${this._counter++}`;
        }
        this.watchForReceipt(this.disconnectHeaders['receipt'], (frame) => {
          this._webSocket.close();
          this._cleanUp();
          this.onDisconnect(frame);
        });
        this._transmit({command: "DISCONNECT", headers: this.disconnectHeaders});
      } catch (error) {
        this.debug(`Ignoring error during disconnect ${error}`);
      }
    } else {
      if (this._webSocket.readyState === WebSocket.CONNECTING || this._webSocket.readyState === WebSocket.OPEN) {
        this._webSocket.close();
      }
    }
  }

  private _cleanUp() {
    this._connected = false;

    if (this._pinger) {
      clearInterval(this._pinger);
    }
    if (this._ponger) {
      clearInterval(this._ponger);
    }
  }

  public publish(params: publishParams): void {
    let {destination, headers, body, binaryBody, skipContentLengthHeader} = params;
    headers = (<any>Object).assign({destination: destination}, headers);
    this._transmit({
      command: "SEND",
      headers: headers,
      body: body,
      binaryBody: binaryBody,
      skipContentLengthHeader: skipContentLengthHeader
    });
  }

  public watchForReceipt(receiptId: string, callback: frameCallbackType): void {
    this._receiptWatchers[receiptId] = callback;
  }

  public subscribe(destination: string, callback: messageCallbackType, headers: StompHeaders = {}): StompSubscription {
    if (!headers.id) {
      headers.id = `sub-${this._counter++}`;
    }
    headers.destination = destination;
    this._subscriptions[headers.id] = callback;
    this._transmit({command: "SUBSCRIBE", headers: headers});
    const client = this;
    return {
      id: headers.id,

      unsubscribe(hdrs) {
        return client.unsubscribe(headers.id, hdrs);
      }
    };
  }

  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    if (headers == null) {
      headers = {};
    }
    delete this._subscriptions[id];
    headers.id = id;
    this._transmit({command: "UNSUBSCRIBE", headers: headers});
  }

  public begin(transactionId: string): Transaction {
    const txId = transactionId || (`tx-${this._counter++}`);
    this._transmit({
      command: "BEGIN", headers: {
        transaction: txId
      }
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

  public commit(transactionId: string): void {
    this._transmit({
      command: "COMMIT", headers: {
        transaction: transactionId
      }
    });
  }

  public abort(transactionId: string): void {
    this._transmit({
      command: "ABORT", headers: {
        transaction: transactionId
      }
    });
  }

  public ack(messageId: string, subscriptionId: string, headers: StompHeaders = {}): void {
    if (this._connectedVersion === Versions.V1_2) {
      headers["id"] = messageId;
    } else {
      headers["message-id"] = messageId;
    }
    headers.subscription = subscriptionId;
    this._transmit({command: "ACK", headers: headers});
  }

  public nack(messageId: string, subscriptionId: string, headers: StompHeaders = {}): void {
    if (this._connectedVersion === Versions.V1_2) {
      headers["id"] = messageId;
    } else {
      headers["message-id"] = messageId;
    }
    headers.subscription = subscriptionId;
    return this._transmit({command: "NACK", headers: headers});
  }

}
