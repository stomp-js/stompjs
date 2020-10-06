import { BYTE } from './byte';
import { Client } from './client';
import { FrameImpl } from './frame-impl';
import { IMessage } from './i-message';
import { ITransaction } from './i-transaction';
import { Parser } from './parser';
import { StompConfig } from './stomp-config';
import { StompHeaders } from './stomp-headers';
import { StompSubscription } from './stomp-subscription';
import {
  closeEventCallbackType,
  debugFnType,
  frameCallbackType,
  IPublishParams,
  IStompSocket,
  IStompSocketMessageEvent,
  messageCallbackType,
  StompSocketState,
  wsErrorCallbackType,
} from './types';
import { Versions } from './versions';

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

  private _onclose: (closeEvent: any) => void;

  constructor(
    private _client: Client,
    private _webSocket: IStompSocket,
    config: StompConfig = {}
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

    this.configure(config);
  }

  public configure(conf: StompConfig): void {
    // bulk assign all properties to this
    (Object as any).assign(this, conf);
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

      parser.parseChunk(evt.data, this.appendMissingNULLonIncoming);
    };

    this._onclose = (closeEvent): void => {
      this.debug(`Connection closed to ${this._client.brokerURL}`);
      this._cleanUp();
      this.onWebSocketClose(closeEvent);
    };

    this._webSocket.onclose = this._onclose;

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
    // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.2.html#CONNECTED_Frame)
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

    // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.2.html#MESSAGE)
    MESSAGE: frame => {
      // the callback is registered when the client calls
      // `subscribe()`.
      // If there is no registered subscription for the received message,
      // the default `onUnhandledMessage` callback is used that the client can set.
      // This is useful for subscriptions that are automatically created
      // on the browser side (e.g. [RabbitMQ's temporary
      // queues](http://www.rabbitmq.com/stomp.html)).
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

    // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.2.html#RECEIPT)
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

    // [ERROR Frame](http://stomp.github.com/stomp-specification-1.2.html#ERROR)
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
          if (this.discardWebsocketOnCommFailure) {
            this.debug(
              'Discarding websocket, the underlying socket may linger for a while'
            );
            this._discardWebsocket();
          } else {
            this.debug('Issuing close on the websocket');
            this._closeWebsocket();
          }
        }
      }, ttl);
    }
  }

  public _closeWebsocket() {
    this._webSocket.onmessage = () => {}; // ignore messages
    this._webSocket.close();
  }

  private _discardWebsocket() {
    const noOp = () => {};

    // set all callbacks to no op
    this._webSocket.onerror = noOp;
    this._webSocket.onmessage = noOp;
    this._webSocket.onopen = noOp;

    const ts = new Date();

    // Track delay in actual closure of the socket
    this._webSocket.onclose = closeEvent => {
      const delay = new Date().getTime() - ts.getTime();
      this.debug(
        `Discarded socket closed after ${delay}ms, with code/reason: ${closeEvent.code}/${closeEvent.reason}`
      );
    };

    this._webSocket.close();

    const customCloseEvent = {
      code: 4001,
      reason: 'Heartbeat failure, discarding the socket',
      wasClean: false,
    };

    this._onclose(customCloseEvent);
  }

  private _transmit(params: {
    command: string;
    headers?: StompHeaders;
    body?: string;
    binaryBody?: Uint8Array;
    skipContentLengthHeader?: boolean;
  }): void {
    const {
      command,
      headers,
      body,
      binaryBody,
      skipContentLengthHeader,
    } = params;
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
    }
    if (this._ponger) {
      clearInterval(this._ponger);
    }
  }

  public publish(params: IPublishParams): void {
    const {
      destination,
      headers,
      body,
      binaryBody,
      skipContentLengthHeader,
    } = params;
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
