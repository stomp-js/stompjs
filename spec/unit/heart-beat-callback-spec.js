describe('Client heartbeat handling (callbacks)', () => {
  let client;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  it('Should invoke onHeartbeatReceived callback when a heartbeat is received', async () => {
    let heartbeatCounter = 0;

    client.onHeartbeatReceived = () => {
      heartbeatCounter++;
    };

    client.heartbeatIncoming = 1000; // 1 second for incoming heartbeat
    client.heartbeatOutgoing = 0; // disable outgoing heartbeat

    await new Promise(resolve => {
      client.onConnect = () => {
        // Allow time for multiple heartbeats to be received
        setTimeout(() => {
          expect(heartbeatCounter).toBeGreaterThan(0);
          resolve();
        }, 1500); // Slightly longer than the heartbeat interval
      };

      client.activate();
    });
  });

  it('Should invoke onHeartbeatLost callback when heartbeats are missed', async () => {
    let heartbeatLostCounter = 0;

    client.onHeartbeatLost = () => {
      heartbeatLostCounter++;
    };

    client.heartbeatIncoming = 1000; // 1-second interval for incoming heartbeat
    client.heartbeatToleranceMultiplier = 1.5; // Tolerates 1.5x the heartbeat interval
    client.heartbeatOutgoing = 0; // Outgoing heartbeat disabled

    // Override WebSocket to suppress incoming heartbeat signals
    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev) {
          // Simulating missed heartbeats by suppressing PINGs
          if (getLength(ev.data) === 1) {
            return; // Do not handle heartbeats
          }
          super.wrapOnMessage(ev);
        }
      }
    );

    await new Promise(resolve => {
      client.onConnect = () => {
        setTimeout(() => {
          expect(heartbeatLostCounter).toBeGreaterThan(0); // Verify the callback was triggered
          resolve();
        }, 2000); // Wait longer than the allowed tolerance period
      };

      client.activate();
    });
  });

  it('Should not invoke onHeartbeatLost when all heartbeats are received on time', async () => {
    let heartbeatLostCounter = 0;

    client.onHeartbeatLost = () => {
      heartbeatLostCounter++;
    };

    client.heartbeatIncoming = 1000; // 1-second interval for incoming heartbeat
    client.heartbeatToleranceMultiplier = 1.5; // Tolerates 1.5x the heartbeat interval
    client.heartbeatOutgoing = 0; // Outgoing heartbeat disabled

    await new Promise(resolve => {
      client.onConnect = () => {
        setTimeout(() => {
          expect(heartbeatLostCounter).toBe(0); // Verify the callback was not triggered
          resolve();
        }, 2000); // Allow enough time to confirm regular heartbeats
      };

      client.activate();
    });
  });
});
