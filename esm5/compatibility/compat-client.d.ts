import { Client } from "../client";
import { StompHeaders } from "../stomp-headers";
import { frameCallbackType, messageCallbackType } from "../types";
export declare class CompatClient extends Client {
    constructor(webSocketFactory: () => any);
    private _parseConnect;
    /**
     * The `connect` method accepts different number of arguments and types. See the Overloads list. Use the
     * version with headers to pass your broker specific options.
     *
     * @overload connect(headers, connectCallback)
     *
     * @overload connect(headers, connectCallback, errorCallback)
     *
     * @overload connect(login, passcode, connectCallback)
     *
     * @overload connect(login, passcode, connectCallback, errorCallback)
     *
     * @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback)
     *
     * @overload connect(login, passcode, connectCallback, errorCallback, closeEventCallback, host)
     *
     * @param headers [Object]
     * @option headers [String] login
     * @option headers [String] passcode
     * @option headers [String] host virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
     * @param connectCallback [function(Frame)] Called upon a successful connect or reconnect
     * @param errorCallback [function(any)] Optional, called upon an error. The passed paramer may be a {Frame} or a message
     * @param closeEventCallback [function(CloseEvent)] Optional, called when the websocket is closed.
     *
     * @param login [String]
     * @param passcode [String]
     * @param host [String] Optional, virtual host to connect to. STOMP 1.2 makes it mandatory, however the broker may not mandate it
     *
     * @example
     *        client.connect('guest, 'guest', function(frame) {
     *          client.debug("connected to Stomp");
     *          client.subscribe(destination, function(message) {
     *            $("#messages").append("<p>" + message.body + "</p>\n");
     *          });
     *        });
     *
     * @note When auto reconnect is active, `connectCallback` and `errorCallback` will be called on each connect or error
     *
     * @see http:*stomp.github.com/stomp-specification-1.2.html#CONNECT_or_STOMP_Frame CONNECT Frame
     */
    connect(...args: any[]): void;
    disconnect(disconnectCallback?: any, headers?: StompHeaders): void;
    reconnect_delay: number;
    readonly ws: any;
    onreceive: messageCallbackType;
    onreceipt: frameCallbackType;
    private _heartbeatInfo;
    heartbeat: {
        incoming: number;
        outgoing: number;
    };
}
