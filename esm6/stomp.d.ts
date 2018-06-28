import { Client } from "./client";
export declare class Stomp {
    static VERSIONS: {
        V1_0: string;
        V1_1: string;
        V1_2: string;
        supportedVersions: () => string;
    };
    static WebSocketClass: any;
    static client(url: any, protocols: any): Client;
    static over(ws: any): Client;
    static setInterval(interval: any, f: any): void;
    static clearInterval(id: any): void;
}
