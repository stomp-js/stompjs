/*
  These tests wrap a web socket and force introduce errors.
  In this case the wrapper eats away pings.
  Typically either side, when they are expecting pings, will wait for 2*heartbeat interval before closing.
  RabbitMQ does not support heartbeat intervals of less than 1000ms.
  So, altogether, these tests will each take slightly more than 2000ms each.
 */

describe('Ping', () => {
  let client;

  beforeEach(() => {
    client = stompClient();
  });

  afterEach(async () => {
    await disconnectStomp(client);
  });

  // Find length -
  const length = data => {
    return typeof data === 'string' ? data.length : data.byteLength;
  };

  // See https://github.com/stomp-js/stompjs/issues/188
  it('Should allow server to not send heartbeat header', done => {
    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev) {
          const inComingFrame = parseFrame(ev.data);

          if (inComingFrame.command === 'CONNECTED') {
            const frame = StompJs.FrameImpl.fromRawFrame(inComingFrame, true);
            delete frame.headers['heart-beat'];
            ev = { data: frame.serialize() };
          }

          super.wrapOnMessage(ev);
        }
      }
    );

    client.onConnect = () => {
      done();
    };

    client.activate();
  });

  const incomingPingTest = done => {
    client.heartbeatIncoming = 1000;
    client.heartbeatOutgoing = 0;

    overRideFactory(
      client,
      class extends WrapperWS {
        wrapOnMessage(ev) {
          // Eat away incoming ping
          if (length(ev.data) === 1) {
            console.log('Eating incoming ping');
            return;
          }
          super.wrapOnMessage(ev);
        }
      }
    );

    client.onWebSocketClose = ev => {
      if (client.discardWebsocketOnCommFailure) {
        // Discarded socket is closed with a different set of codes.
        expect([1006, 4001]).toContain(ev.code);
      }
      done();
    };

    client.activate();
  };

  it('Should close connection when no incoming ping', incomingPingTest);

  describe('With discardWebsocketOnCommFailure', () => {
    beforeEach(() => {
      client.discardWebsocketOnCommFailure = true;
    });

    it('Should close connection when no incoming ping', incomingPingTest);
  });

  it('Should close connection when no outgoing ping', done => {
    client.heartbeatIncoming = 0;
    client.heartbeatOutgoing = 1000;

    overRideFactory(
      client,
      class extends WrapperWS {
        send(data) {
          // Eat away outgoing ping
          if (length(data) === 1) {
            console.log('Eating outgoing ping');
            return;
          }
          super.send(data);
        }
      }
    );

    client.onWebSocketClose = ev => {
      done();
    };

    client.activate();
  });
});
