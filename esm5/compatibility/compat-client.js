"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("../client");
var CompatClient = /** @class */ (function (_super) {
    __extends(CompatClient, _super);
    function CompatClient(webSocketFactory) {
        var _this = _super.call(this) || this;
        _this._heartbeatInfo = new HeartbeatInfo(_this);
        _this.reconnect_delay = 0;
        _this.webSocketFactory = webSocketFactory;
        // Default from previous version
        _this.debug = function () {
            var message = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                message[_i] = arguments[_i];
            }
            console.log.apply(console, message);
        };
        return _this;
    }
    CompatClient.prototype._parseConnect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var closeEventCallback, connectCallback, errorCallback;
        var headers = {};
        if (args.length < 2) {
            throw ("Connect requires at least 2 arguments");
        }
        if (typeof (args[1]) === 'function') {
            headers = args[0], connectCallback = args[1], errorCallback = args[2], closeEventCallback = args[3];
        }
        else {
            switch (args.length) {
                case 6:
                    headers['login'] = args[0], headers['passcode'] = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4], headers['host'] = args[5];
                    break;
                default:
                    headers['login'] = args[0], headers['passcode'] = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4];
            }
        }
        return [headers, connectCallback, errorCallback, closeEventCallback];
    };
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
    CompatClient.prototype.connect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var out = this._parseConnect.apply(this, args);
        this.connectHeaders = out[0], this.onConnect = out[1], this.onStompError = out[2], this.onWebSocketClose = out[3];
        _super.prototype.connect.call(this);
    };
    CompatClient.prototype.disconnect = function (disconnectCallback, headers) {
        if (headers === void 0) { headers = {}; }
        if (disconnectCallback) {
            this.onDisconnect = disconnectCallback;
        }
        this.disconnectHeaders = headers;
        _super.prototype.disconnect.call(this);
    };
    Object.defineProperty(CompatClient.prototype, "reconnect_delay", {
        set: function (value) {
            this.reconnectDelay = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "ws", {
        get: function () {
            return this._webSocket;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "onreceive", {
        get: function () {
            return this.onUnhandledMessage;
        },
        set: function (value) {
            this.onUnhandledMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "onreceipt", {
        get: function () {
            return this.onReceipt;
        },
        set: function (value) {
            this.onReceipt = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompatClient.prototype, "heartbeat", {
        get: function () {
            return this._heartbeatInfo;
        },
        set: function (value) {
            this.heartbeatIncoming = value.incoming;
            this.heartbeatOutgoing = value.outgoing;
        },
        enumerable: true,
        configurable: true
    });
    return CompatClient;
}(client_1.Client));
exports.CompatClient = CompatClient;
/**
 * @internal
 */
var HeartbeatInfo = /** @class */ (function () {
    function HeartbeatInfo(client) {
        this.client = client;
    }
    Object.defineProperty(HeartbeatInfo.prototype, "outgoing", {
        get: function () {
            return this.client.heartbeatOutgoing;
        },
        set: function (value) {
            this.client.heartbeatOutgoing = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeartbeatInfo.prototype, "incoming", {
        get: function () {
            return this.client.heartbeatIncoming;
        },
        set: function (value) {
            this.client.heartbeatIncoming = value;
        },
        enumerable: true,
        configurable: true
    });
    return HeartbeatInfo;
}());
//# sourceMappingURL=compat-client.js.map