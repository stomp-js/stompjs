import { Client } from './client.js';
import { ITransaction } from './i-transaction.js';
import { StompHeaders } from './stomp-headers.js';
import { StompSubscription } from './stomp-subscription.js';
import { closeEventCallbackType, debugFnType, frameCallbackType, IPublishParams, IStompSocket, IStomptHandlerConfig, messageCallbackType, wsErrorCallbackType } from './types.js';
import { Versions } from './versions.js';
/**
 * The STOMP protocol handler
 *
 * Part of `@stomp/stompjs`.
 *
 * @internal
 */
export declare class StompHandler {
    private _client;
    _webSocket: IStompSocket;
    debug: debugFnType;
    stompVersions: Versions;
    connectHeaders: StompHeaders;
    disconnectHeaders: StompHeaders;
    heartbeatIncoming: number;
    heartbeatOutgoing: number;
    onUnhandledMessage: messageCallbackType;
    onUnhandledReceipt: frameCallbackType;
    onUnhandledFrame: frameCallbackType;
    onConnect: frameCallbackType;
    onDisconnect: frameCallbackType;
    onStompError: frameCallbackType;
    onWebSocketClose: closeEventCallbackType;
    onWebSocketError: wsErrorCallbackType;
    logRawCommunication: boolean;
    splitLargeFrames: boolean;
    maxWebSocketChunkSize: number;
    forceBinaryWSFrames: boolean;
    appendMissingNULLonIncoming: boolean;
    discardWebsocketOnCommFailure: boolean;
    get connectedVersion(): string | undefined;
    private _connectedVersion;
    get connected(): boolean;
    private _connected;
    private readonly _subscriptions;
    private readonly _receiptWatchers;
    private _partialData;
    private _escapeHeaderValues;
    private _counter;
    private _pinger?;
    private _ponger;
    private _lastServerActivityTS;
    constructor(_client: Client, _webSocket: IStompSocket, config: IStomptHandlerConfig);
    start(): void;
    private readonly _serverFrameHandlers;
    private _setupHeartbeat;
    private _closeOrDiscardWebsocket;
    forceDisconnect(): void;
    _closeWebsocket(): void;
    discardWebsocket(): void;
    private _transmit;
    dispose(): void;
    private _cleanUp;
    publish(params: IPublishParams): void;
    watchForReceipt(receiptId: string, callback: frameCallbackType): void;
    subscribe(destination: string, callback: messageCallbackType, headers?: StompHeaders): StompSubscription;
    unsubscribe(id: string, headers?: StompHeaders): void;
    begin(transactionId: string): ITransaction;
    commit(transactionId: string): void;
    abort(transactionId: string): void;
    ack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
    nack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
}
