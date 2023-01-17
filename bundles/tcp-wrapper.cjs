'use strict';

var net = require('net');

/**
 * Possible states for the IStompSocket
 */
var StompSocketState;
(function (StompSocketState) {
    StompSocketState[StompSocketState["CONNECTING"] = 0] = "CONNECTING";
    StompSocketState[StompSocketState["OPEN"] = 1] = "OPEN";
    StompSocketState[StompSocketState["CLOSING"] = 2] = "CLOSING";
    StompSocketState[StompSocketState["CLOSED"] = 3] = "CLOSED";
})(StompSocketState = StompSocketState || (StompSocketState = {}));
/**
 * Possible activation state
 */
var ActivationState;
(function (ActivationState) {
    ActivationState[ActivationState["ACTIVE"] = 0] = "ACTIVE";
    ActivationState[ActivationState["DEACTIVATING"] = 1] = "DEACTIVATING";
    ActivationState[ActivationState["INACTIVE"] = 2] = "INACTIVE";
})(ActivationState = ActivationState || (ActivationState = {}));

/**
 * Wrapper for a TCP socket to make it behave similar to the WebSocket interface
 */
class TCPWrapper {
    constructor(host, port) {
        this.url = `tcp://${host}/${port}/`;
        this.readyState = StompSocketState.CONNECTING;
        this.socket = net.createConnection(port, host, () => {
            if (typeof this.onopen === 'function') {
                this.readyState = StompSocketState.OPEN;
                this.onopen();
            }
        });
        this.socket.on('data', ev => {
            if (typeof this.onmessage === 'function') {
                this.onmessage({ data: ev });
            }
        });
        this.socket.on('close', hadError => {
            this.readyState = StompSocketState.CLOSED;
            if (typeof this.onclose === 'function') {
                if (this._closeEvtOnTermination) {
                    this.onclose(this._closeEvtOnTermination);
                }
                else {
                    this.onclose({ wasClean: !hadError, type: 'CloseEvent', code: 1000 });
                }
            }
        });
        this.socket.on('error', ev => {
            if (typeof this.onerror === 'function') {
                this.onerror({ type: 'Error', error: 100, message: ev });
            }
        });
    }
    send(data) {
        if (typeof data === 'string') {
            this.socket.write(data);
        }
        else {
            this.socket.write(new Uint8Array(data));
        }
    }
    close(code, reason) {
        this.readyState = StompSocketState.CLOSING;
        this.socket.end();
    }
    terminate() {
        this.readyState = StompSocketState.CLOSING;
        this._closeEvtOnTermination = {
            wasClean: false,
            type: 'CloseEvent',
            code: 4001,
        };
        this.socket.destroy();
    }
}

exports.TCPWrapper = TCPWrapper;
//# sourceMappingURL=tcp-wrapper.cjs.map
