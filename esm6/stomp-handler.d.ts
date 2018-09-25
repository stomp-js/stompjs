import { Client } from './client';
import { Versions } from "./versions";
import { StompHeaders } from "./stomp-headers";
import { closeEventCallbackType, debugFnType, frameCallbackType, messageCallbackType, publishParams } from "./types";
import { StompSubscription } from "./stomp-subscription";
import { Transaction } from "./transaction";
import { StompConfig } from "./stomp-config";
/**
 * The STOMP protocol handler
 *
 * @internal
 */
export declare class StompHandler {
    private _client;
    private _webSocket;
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
    readonly connectedVersion: string;
    private _connectedVersion;
    readonly connected: boolean;
    private _connected;
    private readonly _subscriptions;
    private readonly _receiptWatchers;
    private _partialData;
    private _escapeHeaderValues;
    private _counter;
    private _pinger;
    private _ponger;
    private _lastServerActivityTS;
    constructor(_client: Client, _webSocket: WebSocket, config?: StompConfig);
    configure(conf: StompConfig): void;
    start(): void;
    private readonly _serverFrameHandlers;
    private _setupHeartbeat;
    private _transmit;
    dispose(): void;
    private _cleanUp;
    publish(params: publishParams): void;
    watchForReceipt(receiptId: string, callback: frameCallbackType): void;
    subscribe(destination: string, callback: messageCallbackType, headers?: StompHeaders): StompSubscription;
    unsubscribe(id: string, headers?: StompHeaders): void;
    begin(transactionId: string): Transaction;
    commit(transactionId: string): void;
    abort(transactionId: string): void;
    ack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
    nack(messageId: string, subscriptionId: string, headers?: StompHeaders): void;
}
