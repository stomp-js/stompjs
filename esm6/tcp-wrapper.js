import { createConnection } from 'net';
import { StompSocketState, } from './types.js';
/**
 * Wrapper for a TCP socket to make it behave similar to the WebSocket interface
 */
export class TCPWrapper {
    constructor(host, port) {
        const noOp = () => { };
        this.url = `tcp://${host}/${port}/`;
        this.readyState = StompSocketState.CONNECTING;
        this.socket = createConnection(port, host, () => {
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
//# sourceMappingURL=tcp-wrapper.js.map