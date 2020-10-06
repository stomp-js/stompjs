describe('Stomp Acknowledgement (RabbitMQ specific queue destination)', function () {
  let client01;
  let client02;

  beforeEach(function (done) {
    client01 = stompClient();
    client01.onConnect = () => done();
    client01.activate();
  });

  beforeEach(function (done) {
    client02 = stompClient();
    client02.onConnect = () => done();
    client02.activate();
  });

  afterEach(async function () {
    await disconnectStomp(client01);
    await disconnectStomp(client02);
  });

  it('Should deliver to other client if nacked from one', function (done) {
    const queueDestination = '/queue/test01';
    let receivedCount = 0;
    const body = randomText();

    const setUpSubscription = function (client) {
      const onMessage = function (message) {
        if (message.body !== body) {
          return;
        }

        receivedCount++;

        if (receivedCount < 3) {
          message.nack();
          return;
        }

        message.ack();
        done();
      };

      client.subscribe(queueDestination, onMessage, { ack: 'client' });
    };

    setUpSubscription(client01);
    setUpSubscription(client02);

    client01.publish({ destination: queueDestination, body: body });
  });

  it('Should deliver to other client if connection drops before ack', function (done) {
    const queueDestination = '/queue/test01';
    let receivedCount = 0;
    const body = randomText();

    const setUpSubscription = function (client) {
      const onMessage = function (message) {
        if (message.body !== body) {
          return;
        }

        receivedCount++;

        if (receivedCount === 1) {
          client.deactivate();
          return;
        }

        message.ack();
        done();
      };

      client.subscribe(queueDestination, onMessage, { ack: 'client' });
    };

    setUpSubscription(client01);
    setUpSubscription(client02);

    client01.publish({ destination: queueDestination, body: body });
  });

  it('Should not redeliver after ack', function (done) {
    const queueDestination = '/queue/test01';
    let receivedCount = 0;
    const body = randomText();

    const setUpSubscription = function (client) {
      const onMessage = function (message) {
        if (message.body !== body) {
          return;
        }

        receivedCount++;

        message.ack();
        client.deactivate();

        setTimeout(function () {
          expect(receivedCount).toEqual(1);
          done();
        }, 100);
      };

      client.subscribe(queueDestination, onMessage, { ack: 'client' });
    };

    setUpSubscription(client01);
    setUpSubscription(client02);

    client01.publish({ destination: queueDestination, body: body });
  });
});
