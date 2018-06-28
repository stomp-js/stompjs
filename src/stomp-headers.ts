/**
 * STOMP headers. Many functions calls will accept headers as parameters.
 * The headers sent by Broker will be available as [Frame#headers]{@link Frame#headers}.
 */
export interface StompHeaders { [key: string]: string|number|boolean }
