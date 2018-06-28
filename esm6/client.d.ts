export declare class Client {
    ws_fn: () => any;
    reconnect_delay: number;
    private counter;
    private connected;
    heartbeat: {
        outgoing: number;
        incoming: number;
    };
    maxWebSocketFrameSize: number;
    private subscriptions;
    private partialData;
    private escapeHeaderValues;
    ws: WebSocket;
    private pinger;
    private ponger;
    private serverActivity;
    private headers;
    private connectCallback;
    private errorCallback;
    private closeEventCallback;
    private _active;
    private version;
    private onreceive;
    private closeReceipt;
    private _disconnectCallback;
    private onreceipt;
    private _reconnector;
    private partial;
    static now(): any;
    constructor(ws_fn: () => any);
    debug: (...message: any[]) => void;
    private _transmit;
    _setupHeartbeat(headers: any): void;
    _parseConnect(...args: any[]): any[];
    connect(...args: any[]): () => void;
    _connect(): () => void;
    _schedule_reconnect(): number;
    disconnect(disconnectCallback: any, headers?: {}): void;
    _cleanUp(): void;
    send(destination: any, headers: any, body: any): void;
    subscribe(destination: any, callback: any, headers: any): {
        id: any;
        unsubscribe(hdrs: any): void;
    };
    unsubscribe(id: any, headers: any): void;
    begin(transaction_id: any): {
        id: any;
        commit(): void;
        abort(): void;
    };
    commit(transaction_id: any): void;
    abort(transaction_id: any): void;
    ack(messageID: any, subscription: any, headers: any): void;
    nack(messageID: any, subscription: any, headers: any): void;
}
