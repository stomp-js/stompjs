import { Message } from "./message";
import { Frame } from "./frame";
export declare type messageCallbackType = (message: Message) => void;
export declare type frameCallbackType = (receipt: Frame) => void;
