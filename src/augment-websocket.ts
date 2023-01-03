import { IStompSocket } from './types.js';

/**
 * @internal
 */
export function augmentWebsocket(
  webSocket: IStompSocket,
  debug: (msg: string) => void
) {
  webSocket.terminate = function () {
    const noOp = () => {};

    // set all callbacks to no op
    this.onerror = noOp;
    this.onmessage = noOp;
    this.onopen = noOp;

    const ts = new Date();
    const id = Math.random().toString().substring(2, 8); // A simulated id

    const origOnClose = this.onclose;

    // Track delay in actual closure of the socket
    this.onclose = closeEvent => {
      const delay = new Date().getTime() - ts.getTime();
      debug(
        `Discarded socket (#${id})  closed after ${delay}ms, with code/reason: ${closeEvent.code}/${closeEvent.reason}`
      );
    };

    this.close();

    origOnClose?.call(webSocket, {
      code: 4001,
      reason: `Quick discarding socket (#${id}) without waiting for the shutdown sequence.`,
      wasClean: false,
    });
  };
}
