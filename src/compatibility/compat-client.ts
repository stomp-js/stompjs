import {Client} from "../client";

export class CompatClient extends Client {

  // Deprecated code
  set reconnect_delay(value: number) {
    this.reconnectDelay = value;
  }
  get ws(): any {
    return this._webSocket;
  }
}