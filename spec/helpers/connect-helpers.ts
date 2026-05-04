import { WebSocket, TEST } from './test-config.js';
import * as StompJs from '../../esm6/index.js';
import { WrapperWS } from './wrapper-ws.js';

let id = 0;

export function stompClient(): StompJs.Client {
  const myId = ++id;

  const stompConfig: StompJs.StompConfig = {
    connectHeaders: {
      login: TEST.login,
      passcode: TEST.password,
    },
    brokerURL: TEST.url,
    debug: function (str) {
      console.log('CLIENT ' + myId + ': ' + str);
    },
    reconnectDelay: 0,
  };

  return new StompJs.Client(stompConfig);
}

export function badStompClient(): StompJs.Client {
  const client = stompClient();
  // brokerURL is also provided, in this case webSocketFactory should get used
  client.webSocketFactory = function () {
    return new (WebSocket as any)(TEST.badUrl);
  };
  return client;
}

// This itself is important, if for some reason, deactivate does not complete, the test will time out.
// Ensure this is called as await in an async function.
export async function disconnectStomp(client: StompJs.Client | undefined): Promise<void> {
  if (client) {
    await client.deactivate();
  }
}

function saveOrigFactory(client: StompJs.Client): void {
  if (!(client as any)._origFactory) {
    (client as any)._origFactory =
      client.webSocketFactory ||
      (() =>
        new (WebSocket as any)(
          client.brokerURL,
          (client as any).stompVersions.protocolVersions()
        ));
  }
}

export function overRideFactory(client: StompJs.Client, WrapperClass: new (ws: any) => WrapperWS): void {
  saveOrigFactory(client);

  client.webSocketFactory = () => new WrapperClass((client as any)._origFactory());
}
