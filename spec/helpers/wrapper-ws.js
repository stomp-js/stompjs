/* Original Typescript code
class WrapperWS {
  get url(): string {
    return this.ws.url;
  }
  get readyState(): number {
    return this.ws.readyState;
  }
  get protocol(): string {
    return this.ws.protocol;
  }
  get binaryType(): 'blob' | 'arraybuffer' {
    return this.ws.binaryType;
  }
  set binaryType(value: 'blob' | 'arraybuffer') {
    this.ws.binaryType = value;
  }

  constructor(public ws: WebSocket) {
    const noOp = () => {};

    this.onclose = noOp;
    this.onerror = noOp;
    this.onmessage = noOp;
    this.onopen = noOp;

    this.ws.onclose = (ev) => {
      this.onclose(ev);
    };
    this.ws.onerror = (ev) => {
      this.onerror(ev);
    };
    this.ws.onmessage = (ev) => {
      this.onmessage(ev);
    };
    this.ws.onopen = (ev) => {
      this.onopen(ev);
    };

    this.close = (code?: number, reason?: string): void => {
      this.ws.close(code, reason);
    };

    this.send  = (data: string | ArrayBuffer | Blob | ArrayBufferView): void => {
      this.ws.send(data);
    };
  }

  public onclose: ((ev: CloseEvent) => any) | null;
  public onerror: ((ev: Event) => any) | null;
  public onmessage: ((ev: MessageEvent) => any) | null;
  public onopen: ((ev: Event) => any) | null;

  public close: (code?: number, reason?: string) => void;
  public send: (data: (string | ArrayBuffer | Blob | ArrayBufferView)) => void;
}
*/

/**
 * A wrapper for WebSocket.
 * By default it is a no op, i.e., exposes the underlying WebSocket without any changes.
 * However by providing alternate implementations to methods (typically send and/or onmessage)
 * several error conditions can be simulated. See ping.spec.js for examples.
 */

WrapperWS = /** @class */ (function () {
  function WrapperWS(ws) {
    var _this = this;
    this.ws = ws;
    var noOp = function () { };
    this.onclose = noOp;
    this.onerror = noOp;
    this.onmessage = noOp;
    this.onopen = noOp;
    this.ws.onclose = function (ev) {
      _this.onclose(ev);
    };
    this.ws.onerror = function (ev) {
      _this.onerror(ev);
    };
    this.ws.onmessage = function (ev) {
      _this.onmessage(ev);
    };
    this.ws.onopen = function (ev) {
      _this.onopen(ev);
    };
    this.close = function (code, reason) {
      _this.ws.close(code, reason);
    };
    this.send = function (data) {
      _this.ws.send(data);
    };
  }
  Object.defineProperty(WrapperWS.prototype, "url", {
    get: function () {
      return this.ws.url;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(WrapperWS.prototype, "readyState", {
    get: function () {
      return this.ws.readyState;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(WrapperWS.prototype, "protocol", {
    get: function () {
      return this.ws.protocol;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(WrapperWS.prototype, "binaryType", {
    get: function () {
      return this.ws.binaryType;
    },
    set: function (value) {
      this.ws.binaryType = value;
    },
    enumerable: true,
    configurable: true
  });
  return WrapperWS;
}());
