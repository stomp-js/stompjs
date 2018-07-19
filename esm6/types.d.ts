import { Message } from "./message";
import { Frame } from "./frame";
import { StompHeaders } from "./stomp-headers";
export declare type debugFnType = (...message: any[]) => void;
export declare type messageCallbackType = (message: Message) => void;
export declare type frameCallbackType = (receipt: Frame) => void;
export declare type closeEventCallbackType = (evt: CloseEvent) => void;
export interface publishParams {
    destination: string;
    headers?: StompHeaders;
    body?: string;
    skipContentLengthHeader: boolean;
}
