/*
  These tests wrap a web socket and force introduce errors.
  In this case the wrapper eats away pings.
  Typically either side, when they are expecting pings, will wait for 2*heartbeat interval before closing.
  RabbitMQ does not support heartbeat intervals of less than 1000ms.
  So, altogether, these tests will each take slightly more than 2000ms each.
 */

describe('Ping', function () {
  let client;

  beforeEach(function () {
    client = stompClient();
  });

  afterEach(async function () {
    await disconnectStomp(client);
  });

  // Find length -
  const length = data => {
    return typeof data === 'string' ? data.length : data.byteLength;
  };

  // See https://github.com/stomp-js/stompjs/issues/188
  it('Should allow server to not send heartbeat header', function (done) {
    client.webSocketFactory = () => {
      const wrapperWS = new WrapperWS(new WebSocket(client.brokerURL));
      let inComingFrame;
      const onFrame = frame => {
        inComingFrame = frame;
      };
      const onIncomingPing = () => {};
      const parser = new StompJs.Parser(onFrame, onIncomingPing);

      wrapperWS.ws.onmessage = ev => {
        parser.parseChunk(ev.data);
        if (inComingFrame.command === 'CONNECTED') {
          const frame = StompJs.FrameImpl.fromRawFrame(
            inComingFrame,
            this._escapeHeaderValues
          );
          delete frame.headers['heart-beat'];
          ev = { data: frame.serialize() };
        }
        wrapperWS.onmessage(ev);
      };
      return wrapperWS;
    };

    client.onConnect = () => {
      done();
    };

    client.activate();
  });

  const incomingPingTest = function (done) {
    client.heartbeatIncoming = 1000;
    client.heartbeatOutgoing = 0;

    client.webSocketFactory = () => {
      const wrapperWS = new WrapperWS(new WebSocket(client.brokerURL));
      wrapperWS.ws.onmessage = ev => {
        // Eat away incoming ping
        if (length(ev.data) === 1) {
          console.log('Eating incoming ping');
          return;
        }
        wrapperWS.onmessage(ev);
      };
      return wrapperWS;
    };

    client.onWebSocketClose = ev => {
      console.log('here');
      done();
    };

    client.activate();
  };

  it('Should close connection when no incoming ping', incomingPingTest);

  describe('With discardWebsocketOnCommFailure', function () {
    beforeEach(function () {
      client.discardWebsocketOnCommFailure = true;
    });

    it('Should close connection when no incoming ping', incomingPingTest);
  });

  it('Should close connection when no outgoing ping', function (done) {
    client.heartbeatIncoming = 0;
    client.heartbeatOutgoing = 1000;

    client.webSocketFactory = () => {
      const wrapperWS = new WrapperWS(new WebSocket(client.brokerURL));
      wrapperWS.send = data => {
        // Eat away outgoing ping
        if (length(data) === 1) {
          console.log('Eating outgoing ping');
          return;
        }
        wrapperWS.ws.send(data);
      };
      return wrapperWS;
    };

    client.onWebSocketClose = ev => {
      done();
    };

    client.activate();
  });
});
