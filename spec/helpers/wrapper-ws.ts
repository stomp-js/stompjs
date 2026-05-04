/**
 * A wrapper for WebSocket.
 * By default, it is a no op, i.e., exposes the underlying WebSocket without any changes.
 * However, by providing alternate implementations to methods (typically send and/or onmessage)
 * several error conditions can be simulated. See heart-beat.spec.ts for examples.
 */
export class WrapperWS {
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
    return this.ws.binaryType as 'blob' | 'arraybuffer';
  }
  set binaryType(value: 'blob' | 'arraybuffer') {
    this.ws.binaryType = value;
  }

  constructor(public ws: any) {
    const noOp = () => {};

    this.onclose = noOp;
    this.onerror = noOp;
    this.onmessage = noOp;
    this.onopen = noOp;

    this.ws.onclose = (ev: any) => {
      this.wrapOnClose(ev);
    };
    this.ws.onerror = (ev: any) => {
      this.wrapOnError(ev);
    };
    this.ws.onmessage = (ev: any) => {
      this.wrapOnMessage(ev);
    };
    this.ws.onopen = (ev: any) => {
      this.wrapOnOpen(ev);
    };
  }

  protected wrapOnOpen(ev: any) {
    this.onopen(ev);
  }

  protected wrapOnMessage(ev: any) {
    this.onmessage(ev);
  }

  protected wrapOnError(ev: any) {
    this.onerror(ev);
  }

  protected wrapOnClose(ev: any) {
    this.onclose(ev);
  }

  public onclose: ((ev: any) => any) | null;
  public onerror: ((ev: any) => any) | null;
  public onmessage: ((ev: any) => any) | null;
  public onopen: ((ev: any) => any) | null;

  public close(code?: number, reason?: string) {
    this.ws.close(code, reason);
  }

  public send(data: any) {
    this.ws.send(data);
  }
}
