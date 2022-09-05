"use strict";
/**
 * A wrapper for WebSocket.
 * By default, it is a no op, i.e., exposes the underlying WebSocket without any changes.
 * However, by providing alternate implementations to methods (typically send and/or onmessage)
 * several error conditions can be simulated. See heart-beat.spec.js for examples.
 */
class WrapperWS {
    constructor(ws) {
        this.ws = ws;
        const noOp = () => { };
        this.onclose = noOp;
        this.onerror = noOp;
        this.onmessage = noOp;
        this.onopen = noOp;
        this.ws.onclose = ev => {
            this.onclose(ev);
        };
        this.ws.onerror = ev => {
            this.onerror(ev);
        };
        this.ws.onmessage = ev => {
            this.onmessage(ev);
        };
        this.ws.onopen = ev => {
            this.onopen(ev);
        };
    }
    get url() {
        return this.ws.url;
    }
    get readyState() {
        return this.ws.readyState;
    }
    get protocol() {
        return this.ws.protocol;
    }
    get binaryType() {
        return this.ws.binaryType;
    }
    set binaryType(value) {
        this.ws.binaryType = value;
    }
    close(code, reason) {
        this.ws.close(code, reason);
    }
    send(data) {
        this.ws.send(data);
    }
}
if (typeof global === 'object') {
    Object.assign(global, {
        'WrapperWS': WrapperWS,
    });
}
