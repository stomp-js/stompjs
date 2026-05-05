import { test, expect } from '@playwright/test';
import { Stomp } from '../../../src/index.js';
import { disconnectStomp } from '../../helpers/connect-helpers.js';

test.describe('Compat mode', () => {
  let client: any;

  test.beforeEach(() => {
    client = Stomp.client();
  });

  test.afterEach(async () => {
    await disconnectStomp(client);
  });

  test('Should set incoming heartbeat interval', () => {
    client.heartbeat.incoming = 5200;
    expect(client.heartbeatIncoming).toEqual(5200);
    expect(client.heartbeat.incoming).toEqual(client.heartbeatIncoming);
  });

  test('Should set outgoing heartbeat interval', () => {
    client.heartbeat.outgoing = 3100;
    expect(client.heartbeatOutgoing).toEqual(3100);
    expect(client.heartbeat.outgoing).toEqual(client.heartbeatOutgoing);
  });

  test('Should set incoming/outgoing heartbeat interval', () => {
    client.heartbeat = { incoming: 2500, outgoing: 3750 };

    expect(client.heartbeatIncoming).toEqual(2500);
    expect(client.heartbeatOutgoing).toEqual(3750);

    expect(client.heartbeat.incoming).toEqual(client.heartbeatIncoming);
    expect(client.heartbeat.outgoing).toEqual(client.heartbeatOutgoing);
  });
});
