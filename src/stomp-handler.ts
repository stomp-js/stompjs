import { BYTE } from './byte.js';
import { Client } from './client.js';
import { FrameImpl } from './frame-impl.js';
import type { IMessage } from './i-message.js';
import { ITransaction } from './i-transaction.js';
import { Parser } from './parser.js';
import { StompHeaders } from './stomp-headers.js';
import { StompSubscription } from './stomp-subscription.js';
import {
  closeEventCallbackType,
  debugFnType,
  frameCallbackType,
  IPublishParams,
  IStompSocket,
  IStompSocketMessageEvent,
  IStomptHandlerConfig,
  messageCallbackType,
  StompSocketState,
  wsErrorCallbackType,
} from './types.js';
import { Versions } from './versions.js';
import { augmentWebsocket } from './augment-websocket.js';

/**
 * The STOMP protocol handler
 *
 * Part of `@stomp/stompjs`.
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

  public onWebSocketError: wsErrorCallbackType;

  public logRawCommunication: boolean;

  public splitLargeFrames: boolean;

  public maxWebSocketChunkSize: number;

  public forceBinaryWSFrames: boolean;

  public appendMissingNULLonIncoming: boolean;

  public discardWebsocketOnCommFailure: boolean;

  get connectedVersion(): string | undefined {
    return this._connectedVersion;
  }
  private _connectedVersion: string | undefined;

  get connected(): boolean {
    return this._connected;
  }

  private _connected: boolean = false;

  private readonly _subscriptions: { [key: string]: messageCallbackType };
  private readonly _receiptWatchers: { [key: string]: frameCallbackType };
  private _partialData: string;
  private _escapeHeaderValues: boolean;
  private _counter: number;
  private _pinger: any;
  private _ponger: any;
  private _lastServerActivityTS: number;

  constructor(
    private _client: Client,
    public _webSocket: IStompSocket,
    config: IStomptHandlerConfig
  ) {
    // used to index subscribers
    this._counter = 0;

    // subscription callbacks indexed by subscriber's ID
    this._subscriptions = {};

    // receipt-watchers indexed by receipts-ids
    this._receiptWatchers = {};

    this._partialData = '';

    this._escapeHeaderValues = false;

    this._lastServerActivityTS = Date.now();

    this.debug = config.debug;
    this.stompVersions = config.stompVersions;
    this.connectHeaders = config.connectHeaders;
    this.disconnectHeaders = config.disconnectHeaders;
    this.heartbeatIncoming = config.heartbeatIncoming;
    this.heartbeatOutgoing = config.heartbeatOutgoing;
    this.splitLargeFrames = config.splitLargeFrames;
    this.maxWebSocketChunkSize = config.maxWebSocketChunkSize;
    this.forceBinaryWSFrames = config.forceBinaryWSFrames;
    this.logRawCommunication = config.logRawCommunication;
    this.appendMissingNULLonIncoming = config.appendMissingNULLonIncoming;
    this.discardWebsocketOnCommFailure = config.discardWebsocketOnCommFailure;
    this.onConnect = config.onConnect;
    this.onDisconnect = config.onDisconnect;
    this.onStompError = config.onStompError;
    this.onWebSocketClose = config.onWebSocketClose;
    this.onWebSocketError = config.onWebSocketError;
    this.onUnhandledMessage = config.onUnhandledMessage;
    this.onUnhandledReceipt = config.onUnhandledReceipt;
    this.onUnhandledFrame = config.onUnhandledFrame;
  }

  public start(): void {
    const parser = new Parser(
      // On Frame
      rawFrame => {
        const frame = FrameImpl.fromRawFrame(
          rawFrame,
          this._escapeHeaderValues
        );

        // if this.logRawCommunication is set, the rawChunk is logged at this._webSocket.onmessage
        if (!this.logRawCommunication) {
          this.debug(`<<< ${frame}`);
        }

        const serverFrameHandler =
          this._serverFrameHandlers[frame.command] || this.onUnhandledFrame;
        serverFrameHandler(frame);
      },
      // On Incoming Ping
      () => {
        this.debug('<<< PONG');
      }
    );

    this._webSocket.onmessage = (evt: IStompSocketMessageEvent) => {
      this.debug('Received data');
      this._lastServerActivityTS = Date.now();

      if (this.logRawCommunication) {
        const rawChunkAsString =
          evt.data instanceof ArrayBuffer
            ? new TextDecoder().decode(evt.data)
            : evt.data;
        this.debug(`<<< ${rawChunkAsString}`);
      }

      parser.parseChunk(
        evt.data as string | ArrayBuffer,
        this.appendMissingNULLonIncoming
      );
    };

    this._webSocket.onclose = (closeEvent): void => {
      this.debug(`Connection closed to ${this._webSocket.url}`);
      this._cleanUp();
      this.onWebSocketClose(closeEvent);
    };

    this._webSocket.onerror = (errorEvent): void => {
      this.onWebSocketError(errorEvent);
    };

    this._webSocket.onopen = () => {
      // Clone before updating
      const connectHeaders = (Object as any).assign({}, this.connectHeaders);

      this.debug('Web Socket Opened...');
      connectHeaders['accept-version'] = this.stompVersions.supportedVersions();
      connectHeaders['heart-beat'] = [
        this.heartbeatOutgoing,
        this.heartbeatIncoming,
      ].join(',');
      this._transmit({ command: 'CONNECT', headers: connectHeaders });
    };
  }

  private readonly _serverFrameHandlers: {
    [key: string]: frameCallbackType;
  } = {
    // [CONNECTED Frame](https://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
    CONNECTED: frame => {
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

    // [MESSAGE Frame](https://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
    MESSAGE: frame => {
      // the callback is registered when the client calls
      // `subscribe()`.
      // If there is no registered subscription for the received message,
      // the default `onUnhandledMessage` callback is used that the client can set.
      // This is useful for subscriptions that are automatically created
      // on the browser side (e.g. [RabbitMQ's temporary
      // queues](https://www.rabbitmq.com/stomp.html)).
      const subscription = frame.headers.subscription;
      const onReceive =
        this._subscriptions[subscription] || this.onUnhandledMessage;

      // bless the frame to be a Message
      const message = frame as IMessage;

      const client = this;
      const messageId =
        this._connectedVersion === Versions.V1_2
          ? message.headers.ack
          : message.headers['message-id'];

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

    // [RECEIPT Frame](https://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
    RECEIPT: frame => {
      const callback = this._receiptWatchers[frame.headers['receipt-id']];
      if (callback) {
        callback(frame);
        // Server will acknowledge only once, remove the callback
        delete this._receiptWatchers[frame.headers['receipt-id']];
      } else {
        this.onUnhandledReceipt(frame);
      }
    },

    // [ERROR Frame](https://stomp.github.com/stomp-specification-1.2.html#ERROR)
    ERROR: frame => {
      this.onStompError(frame);
    },
  };

  private _setupHeartbeat(headers: StompHeaders): void {
    if (
      headers.version !== Versions.V1_1 &&
      headers.version !== Versions.V1_2
    ) {
      return;
    }

    // It is valid for the server to not send this header
    // https://stomp.github.io/stomp-specification-1.2.html#Heart-beating
    if (!headers['heart-beat']) {
      return;
    }

    // heart-beat header received from the server looks like:
    //
    //     heart-beat: sx, sy
    const [serverOutgoing, serverIncoming] = headers['heart-beat']
      .split(',')
      .map((v: string) => parseInt(v, 10));

    if (this.heartbeatOutgoing !== 0 && serverIncoming !== 0) {
      const ttl: number = Math.max(this.heartbeatOutgoing, serverIncoming);
      this.debug(`send PING every ${ttl}ms`);
      this._pinger = setInterval(() => {
        if (this._webSocket.readyState === StompSocketState.OPEN) {
          this._webSocket.send(BYTE.LF);
          this.debug('>>> PING');
        }
      }, ttl);
    }

    if (this.heartbeatIncoming !== 0 && serverOutgoing !== 0) {
      const ttl: number = Math.max(this.heartbeatIncoming, serverOutgoing);
      this.debug(`check PONG every ${ttl}ms`);
      this._ponger = setInterval(() => {
        const delta = Date.now() - this._lastServerActivityTS;
        // We wait twice the TTL to be flexible on window's setInterval calls
        if (delta > ttl * 2) {
          this.debug(`did not receive server activity for the last ${delta}ms`);
          this._closeOrDiscardWebsocket();
        }
      }, ttl);
    }
  }

  private _closeOrDiscardWebsocket() {
    if (this.discardWebsocketOnCommFailure) {
      this.debug(
        'Discarding websocket, the underlying socket may linger for a while'
      );
      this.discardWebsocket();
    } else {
      this.debug('Issuing close on the websocket');
      this._closeWebsocket();
    }
  }

  public forceDisconnect() {
    if (this._webSocket) {
      if (
        this._webSocket.readyState === StompSocketState.CONNECTING ||
        this._webSocket.readyState === StompSocketState.OPEN
      ) {
        this._closeOrDiscardWebsocket();
      }
    }
  }

  public _closeWebsocket() {
    this._webSocket.onmessage = () => {}; // ignore messages
    this._webSocket.close();
  }

  public discardWebsocket() {
    if (typeof this._webSocket.terminate !== 'function') {
      augmentWebsocket(this._webSocket, (msg: string) => this.debug(msg));
    }

    // @ts-ignore - this method will be there at this stage
    this._webSocket.terminate();
  }

  private _transmit(params: {
    command: string;
    headers?: StompHeaders;
    body?: string;
    binaryBody?: Uint8Array;
    skipContentLengthHeader?: boolean;
  }): void {
    const { command, headers, body, binaryBody, skipContentLengthHeader } =
      params;
    const frame = new FrameImpl({
      command,
      headers,
      body,
      binaryBody,
      escapeHeaderValues: this._escapeHeaderValues,
      skipContentLengthHeader,
    });

    let rawChunk = frame.serialize();

    if (this.logRawCommunication) {
      this.debug(`>>> ${rawChunk}`);
    } else {
      this.debug(`>>> ${frame}`);
    }

    if (this.forceBinaryWSFrames && typeof rawChunk === 'string') {
      rawChunk = new TextEncoder().encode(rawChunk);
    }

    if (typeof rawChunk !== 'string' || !this.splitLargeFrames) {
      this._webSocket.send(rawChunk);
    } else {
      let out = rawChunk as string;
      while (out.length > 0) {
        const chunk = out.substring(0, this.maxWebSocketChunkSize);
        out = out.substring(this.maxWebSocketChunkSize);
        this._webSocket.send(chunk);
        this.debug(`chunk sent = ${chunk.length}, remaining = ${out.length}`);
      }
    }
  }

  public dispose(): void {
    if (this.connected) {
      try {
        // clone before updating
        const disconnectHeaders = (Object as any).assign(
          {},
          this.disconnectHeaders
        );

        if (!disconnectHeaders.receipt) {
          disconnectHeaders.receipt = `close-${this._counter++}`;
        }
        this.watchForReceipt(disconnectHeaders.receipt, frame => {
          this._closeWebsocket();
          this._cleanUp();
          this.onDisconnect(frame);
        });
        this._transmit({ command: 'DISCONNECT', headers: disconnectHeaders });
      } catch (error) {
        this.debug(`Ignoring error during disconnect ${error}`);
      }
    } else {
      if (
        this._webSocket.readyState === StompSocketState.CONNECTING ||
        this._webSocket.readyState === StompSocketState.OPEN
      ) {
        this._closeWebsocket();
      }
    }
  }

  private _cleanUp() {
    this._connected = false;

    if (this._pinger) {
      clearInterval(this._pinger);
      this._pinger = undefined;
    }
    if (this._ponger) {
      clearInterval(this._ponger);
      this._ponger = undefined;
    }
  }

  public publish(params: IPublishParams): void {
    const { destination, headers, body, binaryBody, skipContentLengthHeader } =
      params;
    const hdrs: StompHeaders = (Object as any).assign({ destination }, headers);
    this._transmit({
      command: 'SEND',
      headers: hdrs,
      body,
      binaryBody,
      skipContentLengthHeader,
    });
  }

  public watchForReceipt(receiptId: string, callback: frameCallbackType): void {
    this._receiptWatchers[receiptId] = callback;
  }

  public subscribe(
    destination: string,
    callback: messageCallbackType,
    headers: StompHeaders = {}
  ): StompSubscription {
    headers = (Object as any).assign({}, headers);

    if (!headers.id) {
      headers.id = `sub-${this._counter++}`;
    }
    headers.destination = destination;
    this._subscriptions[headers.id] = callback;
    this._transmit({ command: 'SUBSCRIBE', headers });
    const client = this;
    return {
      id: headers.id,

      unsubscribe(hdrs) {
        return client.unsubscribe(headers.id, hdrs);
      },
    };
  }

  public unsubscribe(id: string, headers: StompHeaders = {}): void {
    headers = (Object as any).assign({}, headers);

    delete this._subscriptions[id];
    headers.id = id;
    this._transmit({ command: 'UNSUBSCRIBE', headers });
  }

  public begin(transactionId: string): ITransaction {
    const txId = transactionId || `tx-${this._counter++}`;
    this._transmit({
      command: 'BEGIN',
      headers: {
        transaction: txId,
      },
    });
    const client = this;
    return {
      id: txId,
      commit(): void {
        client.commit(txId);
      },
      abort(): void {
        client.abort(txId);
      },
    };
  }

  public commit(transactionId: string): void {
    this._transmit({
      command: 'COMMIT',
      headers: {
        transaction: transactionId,
      },
    });
  }

  public abort(transactionId: string): void {
    this._transmit({
      command: 'ABORT',
      headers: {
        transaction: transactionId,
      },
    });
  }

  public ack(
    messageId: string,
    subscriptionId: string,
    headers: StompHeaders = {}
  ): void {
    headers = (Object as any).assign({}, headers);

    if (this._connectedVersion === Versions.V1_2) {
      headers.id = messageId;
    } else {
      headers['message-id'] = messageId;
    }
    headers.subscription = subscriptionId;
    this._transmit({ command: 'ACK', headers });
  }

  public nack(
    messageId: string,
    subscriptionId: string,
    headers: StompHeaders = {}
  ): void {
    headers = (Object as any).assign({}, headers);

    if (this._connectedVersion === Versions.V1_2) {
      headers.id = messageId;
    } else {
      headers['message-id'] = messageId;
    }
    headers.subscription = subscriptionId;
    return this._transmit({ command: 'NACK', headers });
  }
}
