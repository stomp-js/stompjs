function toUint8Array(str) {
  return new TextEncoder().encode(str);
}

describe("Neo Parser", function () {
  let onFrame, onIncomingPing, parser;

  beforeEach(function () {
    onFrame = jasmine.createSpy('onFrame');
    onIncomingPing = jasmine.createSpy('onIncomingPing');
    parser = new StompJs.Parser(onFrame, onIncomingPing);
  });

  describe("Basic", function () {
    it("parses a simple Frame", function () {
      const msg = "MESSAGE\ndestination:foo\nmessage-id:456\n\n\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [['destination', 'foo'], ['message-id', '456']],
        body: toUint8Array('')
      });
    });

    it("handles header value with :", function () {
      const msg = "MESSAGE\ndestination:foo:bar:baz\nmessage-id:456\n\n\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [['destination', 'foo:bar:baz'], ['message-id', '456']],
        body: toUint8Array('')
      });
    });

    it("handles header with empty value", function () {
      const msg = "MESSAGE\ndestination:foo\nhdr:\nmessage-id:456\n\n\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [['destination', 'foo'], [ 'hdr', '' ], ['message-id', '456']],
        body: toUint8Array('')
      });
    });

    it("parses a Frame without headers or body", function () {
      const msg = "MESSAGE\n\n\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [ ],
        body: toUint8Array('')
      });
    });

    it("parses a simple Frame spread in multiple chunks", function () {
      const msgChunks = ["MESSAGE\ndestination", ":foo\nmessage-id:45", "6\n\n\0"];

      parser.parseChunk(msgChunks[0]);
      parser.parseChunk(msgChunks[1]);
      parser.parseChunk(msgChunks[2]);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [['destination', 'foo'], ['message-id', '456']],
        body: toUint8Array('')
      });
    });

    it("parses multiple frames, single frame in each chunk", function () {
      const msg = "MESSAGE\ndestination:foo\nmessage-id:456\n\n\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [['destination', 'foo'], ['message-id', '456']],
        body: toUint8Array('')
      });

      const msg2 = "MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0";

      parser.parseChunk(msg2);

      expect(onFrame.calls.mostRecent().args[0]).toEqual({
        command: 'MESSAGE',
        headers: [['destination', 'bar'], ['message-id', '203']],
        body: toUint8Array('Hello World')
      });
    });

    it("parses multiple frames in single chunk", function () {
      const msg = "MESSAGE\ndestination:foo\nmessage-id:456\n\n\0";
      const msg2 = "MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0";

      parser.parseChunk(msg + msg2);

      expect(onFrame.calls.first().args[0]).toEqual({
        command: 'MESSAGE',
        headers: [['destination', 'foo'], ['message-id', '456']],
        body: toUint8Array('')
      });

      expect(onFrame.calls.mostRecent().args[0]).toEqual({
        command: 'MESSAGE',
        headers: [['destination', 'bar'], ['message-id', '203']],
        body: toUint8Array('Hello World')
      });
    });
  });

  describe("Incoming Ping", function () {
    it("recognizes incoming pings", function () {
      const msg = "\nMESSAGE\ndestination:foo\nmessage-id:456\n\n\0";
      parser.parseChunk(msg);

      expect(onIncomingPing).toHaveBeenCalled();
      expect(onFrame).toHaveBeenCalled();

      parser.parseChunk("\n");
      parser.parseChunk("\n");

      expect(onIncomingPing.calls.count()).toBe(3);
    });

    it("ignores CR in incoming pings", function () {
      const msg = "\r\nMESSAGE\r\ndestination:foo\r\nmessage-id:456\r\n\r\n\0";
      parser.parseChunk(msg);

      expect(onIncomingPing).toHaveBeenCalled();
      expect(onFrame).toHaveBeenCalled();

      parser.parseChunk("\r\n");
      parser.parseChunk("\r\n");

      expect(onIncomingPing.calls.count()).toBe(3);
    });
  });

  describe('Text body', function () {
    it("parses a Frame with body", function () {
      const msg = "MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [ [ 'destination', 'bar' ], [ 'message-id', '203' ] ],
        body: toUint8Array('Hello World')
      });
    });

    it("ignores CR while parsing a Frame with body", function () {
      const msg = "MESSAGE\r\ndestination:bar\r\nmessage-id:203\r\n\r\nHello World\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [ [ 'destination', 'bar' ], [ 'message-id', '203' ] ],
        body: toUint8Array('Hello World')
      });
    });

    it("parses a Frame without headers", function () {
      const msg = "MESSAGE\n\nHello World\0";

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [ ],
        body: toUint8Array('Hello World')
      });
    });

  });
});

