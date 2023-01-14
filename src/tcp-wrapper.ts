import { Socket, createConnection } from 'net';
import { IStompSocket, IStompSocketMessageEvent } from './types.js';

/**
 * Wrapper for a TCP socket to make it behave similar to the WebSocket interface
 */
export class TCPWrapper implements IStompSocket {
  public onclose: ((this: IStompSocket, ev?: any) => any) | undefined | null;
  public onerror: ((this: IStompSocket, ev: any) => any) | undefined | null;
  public onmessage:
    | ((this: IStompSocket, ev: IStompSocketMessageEvent) => any)
    | undefined
    | null;
  public onopen: ((this: IStompSocket, ev?: any) => any) | undefined | null;
  private socket: Socket;
  private _closeEvtOnTermination: object | undefined;

  constructor(host: string, port: number) {
    const noOp = () => {};

    this.socket = createConnection(port, host, () => {
      if (typeof this.onopen === 'function') {
        this.onopen();
      }
    });

    this.socket.on('data', ev => {
      if (typeof this.onmessage === 'function') {
        this.onmessage({ data: ev });
      }
    });

    this.socket.on('close', hadError => {
      if (typeof this.onclose === 'function') {
        if (this._closeEvtOnTermination) {
          this.onclose(this._closeEvtOnTermination);
        } else {
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

  public send(data: string | ArrayBuffer) {
    if (typeof data === 'string') {
      this.socket.write(data);
    } else {
      this.socket.write(new Uint8Array(data));
    }
  }

  public close(code?: number, reason?: string) {
    this.socket.end();
  }

  public terminate() {
    this._closeEvtOnTermination = {
      wasClean: false,
      type: 'CloseEvent',
      code: 4001,
    };
    this.socket.destroy();
  }
}
