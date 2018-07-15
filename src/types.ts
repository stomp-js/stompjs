import {Message} from "./message";
import {Frame} from "./frame";
import {StompHeaders} from "./stomp-headers";

export type debugFnType = (...message: any[]) => void;

export type messageCallbackType = (message: Message) => void;
export type frameCallbackType = (receipt: Frame) => void;
export type closeEventCallbackType = (evt: CloseEvent) => void;

export interface publishParams {
  destination: string,
  headers?: StompHeaders,
  body?: string
}
