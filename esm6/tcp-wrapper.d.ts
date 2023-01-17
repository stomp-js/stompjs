import { IStompSocket, IStompSocketMessageEvent, StompSocketState } from './types.js';
/**
 * Wrapper for a TCP socket to make it behave similar to the WebSocket interface
 */
export declare class TCPWrapper implements IStompSocket {
    readyState: StompSocketState;
    readonly url: string;
    onclose: ((this: IStompSocket, ev?: any) => any) | undefined | null;
    onerror: ((this: IStompSocket, ev: any) => any) | undefined | null;
    onmessage: ((this: IStompSocket, ev: IStompSocketMessageEvent) => any) | undefined | null;
    onopen: ((this: IStompSocket, ev?: any) => any) | undefined | null;
    private socket;
    private _closeEvtOnTermination;
    constructor(host: string, port: number);
    send(data: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
}
