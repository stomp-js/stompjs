import {Message} from "./message";
import {Frame} from "./frame";

export type messageCallbackType = (message: Message) => void;
export type frameCallbackType = (receipt: Frame) => void;
