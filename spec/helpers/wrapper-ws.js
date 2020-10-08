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
 * several error conditions can be simulated. See heart-beat.spec.js for examples.
 */
WrapperWS = class {
  constructor(ws) {
    this.ws = ws;
    const noOp = () => {};
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
    this.close = (code, reason) => {
      this.ws.close(code, reason);
    };
    this.send = data => {
      this.ws.send(data);
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
};
