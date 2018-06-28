import { StompHeaders } from "./headers";
export declare class Frame {
    command: string;
    headers: StompHeaders;
    body: any;
    escapeHeaderValues: boolean;
    constructor(command: string, headers?: StompHeaders, body?: any, escapeHeaderValues?: boolean);
    toString(): string;
    private static sizeOfUTF8;
    static unmarshallSingle(data: any, escapeHeaderValues: boolean): Frame;
    static unmarshall(datas: any, escapeHeaderValues: boolean): {
        frames: any[];
        partial: string;
    };
    static marshall(command: string, headers: StompHeaders, body: any, escapeHeaderValues: boolean): string;
    private static frEscape;
    private static frUnEscape;
}
