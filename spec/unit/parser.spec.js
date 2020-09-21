function toUint8Array(str) {
  return new TextEncoder().encode(str);
}

function toArrayBuffer(cmdAndHeaders, binaryBody) {
  const uint8CmdAndHeaders = new TextEncoder().encode(cmdAndHeaders);
  const nullTerminator = new Uint8Array([0]);
  const uint8Frame = new Uint8Array(
    uint8CmdAndHeaders.length + binaryBody.length + nullTerminator.length
  );

  uint8Frame.set(uint8CmdAndHeaders);
  uint8Frame.set(binaryBody, uint8CmdAndHeaders.length);
  uint8Frame.set(nullTerminator, uint8CmdAndHeaders.length + binaryBody.length);

  return uint8Frame.buffer;
}

describe('Neo Parser', function () {
  let onFrame, onIncomingPing, parser;

  beforeEach(function () {
    onFrame = jasmine.createSpy('onFrame');
    onIncomingPing = jasmine.createSpy('onIncomingPing');
    parser = new StompJs.Parser(onFrame, onIncomingPing);
  });

  describe('Basic', function () {
    it('parses a simple Frame', function () {
      const msg = 'MESSAGE\ndestination:foo\nmessage-id:456\n\n\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo'],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });
    });

    it('parses a simple Frame given as ArrayBuffer', function () {
      const msg = 'MESSAGE\ndestination:foo\nmessage-id:456\n\n\0';

      const msgAsArrayBuffer = new TextEncoder().encode(msg).buffer;

      parser.parseChunk(msgAsArrayBuffer);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo'],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });
    });

    it('handles header value with :', function () {
      const msg = 'MESSAGE\ndestination:foo:bar:baz\nmessage-id:456\n\n\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo:bar:baz'],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });
    });

    it('handles header with empty value', function () {
      const msg = 'MESSAGE\ndestination:foo\nhdr:\nmessage-id:456\n\n\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo'],
          ['hdr', ''],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });
    });

    it('parses a Frame without headers or binaryBody', function () {
      const msg = 'MESSAGE\n\n\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [],
        binaryBody: toUint8Array(''),
      });
    });

    it('parses a simple Frame spread in multiple chunks', function () {
      const msgChunks = [
        'MESSAGE\ndestination',
        ':foo\nmessage-id:45',
        '6\n\n\0',
      ];

      parser.parseChunk(msgChunks[0]);
      parser.parseChunk(msgChunks[1]);
      parser.parseChunk(msgChunks[2]);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo'],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });
    });

    it('parses multiple frames, single frame in each chunk', function () {
      const msg = 'MESSAGE\ndestination:foo\nmessage-id:456\n\n\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo'],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });

      const msg2 = 'MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0';

      parser.parseChunk(msg2);

      expect(onFrame.calls.mostRecent().args[0]).toEqual({
        command: 'MESSAGE',
        headers: [
          ['destination', 'bar'],
          ['message-id', '203'],
        ],
        binaryBody: toUint8Array('Hello World'),
      });
    });

    it('parses multiple frames in single chunk', function () {
      const msg = 'MESSAGE\ndestination:foo\nmessage-id:456\n\n\0';
      const msg2 = 'MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0';

      parser.parseChunk(msg + msg2);

      expect(onFrame.calls.first().args[0]).toEqual({
        command: 'MESSAGE',
        headers: [
          ['destination', 'foo'],
          ['message-id', '456'],
        ],
        binaryBody: toUint8Array(''),
      });

      expect(onFrame.calls.mostRecent().args[0]).toEqual({
        command: 'MESSAGE',
        headers: [
          ['destination', 'bar'],
          ['message-id', '203'],
        ],
        binaryBody: toUint8Array('Hello World'),
      });
    });
  });

  describe('Incoming Ping', function () {
    it('recognizes incoming pings', function () {
      parser.parseChunk('\n');
      expect(onIncomingPing).toHaveBeenCalled();

      parser.parseChunk('MESSAGE\ndestination:foo\nmessage-id:456\n\n\0');
      expect(onFrame).toHaveBeenCalled();

      parser.parseChunk('\n');
      parser.parseChunk('\n');

      expect(onIncomingPing.calls.count()).toBe(3);
    });

    it('ignores CR in incoming pings', function () {
      const msg = '\r\nMESSAGE\r\ndestination:foo\r\nmessage-id:456\r\n\r\n\0';
      parser.parseChunk(msg);

      expect(onIncomingPing).toHaveBeenCalled();
      expect(onFrame).toHaveBeenCalled();

      parser.parseChunk('\r\n');
      parser.parseChunk('\r\n');

      expect(onIncomingPing.calls.count()).toBe(3);
    });
  });

  describe('Text body', function () {
    it('parses a Frame with body', function () {
      const msg = 'MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'bar'],
          ['message-id', '203'],
        ],
        binaryBody: toUint8Array('Hello World'),
      });
    });

    it('ignores CR while parsing a Frame with body', function () {
      const msg =
        'MESSAGE\r\ndestination:bar\r\nmessage-id:203\r\n\r\nHello World\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [
          ['destination', 'bar'],
          ['message-id', '203'],
        ],
        binaryBody: toUint8Array('Hello World'),
      });
    });

    it('parses a Frame without headers', function () {
      const msg = 'MESSAGE\n\nHello World\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [],
        binaryBody: toUint8Array('Hello World'),
      });
    });
  });

  describe('Binary body', function () {
    let binaryBody, commandAndHeaders, rawChunk;

    let vefiyRawFrame = function (rawFrame) {
      expect(rawFrame.command).toEqual('SEND');
      expect(rawFrame.headers).toEqual([
        ['destination', 'foo'],
        ['message-id', '456'],
        ['content-length', '1024'],
      ]);
      expect(rawFrame.binaryBody.toString()).toEqual(binaryBody.toString());
    };

    beforeEach(function () {
      // construct binaryBody with octets 0 to 255 repeated 4 times (1 Kilo Bytes)
      binaryBody = generateBinaryData(1);
      commandAndHeaders =
        'SEND\n' +
        'destination:foo\n' +
        'message-id:456\n' +
        'content-length:1024\n' +
        '\n';
      rawChunk = toArrayBuffer(commandAndHeaders, binaryBody);
    });

    it('handles binary octets in body', function () {
      parser.parseChunk(rawChunk);

      const rawFrame = onFrame.calls.first().args[0];
      vefiyRawFrame(rawFrame);
    });

    it('handles multiple binary frames', function () {
      parser.parseChunk(rawChunk);
      parser.parseChunk(rawChunk);
      parser.parseChunk(rawChunk);

      expect(onFrame.calls.count()).toEqual(3);
      const rawFrame = onFrame.calls.mostRecent().args[0];

      vefiyRawFrame(rawFrame);
    });

    it('handles binary frame is split chunks', function () {
      parser.parseChunk(rawChunk.slice(0, 200));
      parser.parseChunk(rawChunk.slice(200, 500));
      parser.parseChunk(rawChunk.slice(500, rawChunk.byteLength));

      const rawFrame = onFrame.calls.first().args[0];

      vefiyRawFrame(rawFrame);
    });

    it('handles mixed text and binary chunks', function () {
      parser.parseChunk(commandAndHeaders); // Text chunk
      parser.parseChunk(binaryBody.buffer); // Array buffer chunk, binary octets
      parser.parseChunk('\0'); // Text chunk

      const rawFrame = onFrame.calls.first().args[0];

      vefiyRawFrame(rawFrame);
    });

    it('waits for trailing NULL before yielding frame', function () {
      parser.parseChunk(rawChunk.slice(0, rawChunk.byteLength - 1)); // Excluding the terminating NULL

      expect(onFrame).not.toHaveBeenCalled();

      parser.parseChunk(new Uint8Array([0]).buffer); // terminating NULL

      expect(onFrame).toHaveBeenCalled();
    });

    it('handles text and binary frames with incoming pings', function () {
      parser.parseChunk('MESSAGE\ndestination:foo\nmessage-id:456\n\n\0');
      parser.parseChunk('\n');
      parser.parseChunk('\n');
      parser.parseChunk(rawChunk);
      parser.parseChunk('\n');

      expect(onFrame.calls.count()).toEqual(2);
      expect(onIncomingPing.calls.count()).toEqual(3);

      const rawFrame = onFrame.calls.mostRecent().args[0];
      vefiyRawFrame(rawFrame);
    });
  });
});
