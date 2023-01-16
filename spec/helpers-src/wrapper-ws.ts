/**
 * A wrapper for WebSocket.
 * By default, it is a no op, i.e., exposes the underlying WebSocket without any changes.
 * However, by providing alternate implementations to methods (typically send and/or onmessage)
 * several error conditions can be simulated. See heart-beat.spec.js for examples.
 */
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

    this.ws.onclose = ev => {
      this.wrapOnClose(ev);
    };
    this.ws.onerror = ev => {
      this.wrapOnError(ev);
    };
    this.ws.onmessage = ev => {
      this.wrapOnMessage(ev);
    };
    this.ws.onopen = ev => {
      this.wrapOnOpen(ev);
    };
  }

  protected wrapOnOpen(ev: Event) {
    this.onopen(ev);
  }

  protected wrapOnMessage(ev: MessageEvent<any>) {
    this.onmessage(ev);
  }

  protected wrapOnError(ev: Event) {
    this.onerror(ev);
  }

  protected wrapOnClose(ev: CloseEvent) {
    this.onclose(ev);
  }

  public onclose: ((ev: CloseEvent) => any) | null;
  public onerror: ((ev: Event) => any) | null;
  public onmessage: ((ev: MessageEvent) => any) | null;
  public onopen: ((ev: Event) => any) | null;

  public close(code?: number, reason?: string) {
    this.ws.close(code, reason);
  }

  public send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
    this.ws.send(data);
  }
}

if (typeof global === 'object') {
  Object.assign(global, {
    WrapperWS: WrapperWS,
  });
}
