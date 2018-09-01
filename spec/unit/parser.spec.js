describe("Neo Parser", function () {
  let onFrame, onIncomingPing, parser;

  beforeEach(function () {
    onFrame = jasmine.createSpy('onFrame');
    onIncomingPing = jasmine.createSpy('onIncomingPing');
    parser = new StompJs.Parser(onFrame, onIncomingPing);
  });

  it("Should parse a simple Frame", function () {
    const msg = "MESSAGE\ndestination:foo\nmessage-id:456\n\n\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [['destination', 'foo'], ['message-id', '456']],
      body: ''
    });
  });

  it("Should parse a header value with :", function () {
    const msg = "MESSAGE\ndestination:foo:bar:baz\nmessage-id:456\n\n\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [['destination', 'foo:bar:baz'], ['message-id', '456']],
      body: ''
    });
  });

  it("Should parse a Frame with empty header value", function () {
    const msg = "MESSAGE\ndestination:foo\nhdr:\nmessage-id:456\n\n\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [['destination', 'foo'], [ 'hdr', '' ], ['message-id', '456']],
      body: ''
    });
  });

  it("Should parse a Frame with body", function () {
    const msg = "MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [ [ 'destination', 'bar' ], [ 'message-id', '203' ] ],
      body: 'Hello World'
    });
  });

  it("Should ignore cr parse a Frame with body", function () {
    const msg = "MESSAGE\r\ndestination:bar\r\nmessage-id:203\r\n\r\nHello World\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [ [ 'destination', 'bar' ], [ 'message-id', '203' ] ],
      body: 'Hello World'
    });
  });

  it("Should parse a Frame without headers", function () {
    const msg = "MESSAGE\n\nHello World\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [ ],
      body: 'Hello World'
    });
  });

  it("Should parse a Frame without headers or body", function () {
    const msg = "MESSAGE\n\n\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [ ],
      body: ''
    });
  });

  it("Should parse a simple Frame given a multiple chunks", function () {
    const msgChunks = ["MESSAGE\ndestination", ":foo\nmessage-id:45", "6\n\n\0"];

    parser.parseChunk(msgChunks[0]);
    parser.parseChunk(msgChunks[1]);
    parser.parseChunk(msgChunks[2]);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [['destination', 'foo'], ['message-id', '456']],
      body: ''
    });
  });

  it("Should parse frames in one frame each chunk", function () {
    const msg = "MESSAGE\ndestination:foo\nmessage-id:456\n\n\0";

    parser.parseChunk(msg);

    expect(onFrame).toHaveBeenCalledWith({
      command: 'MESSAGE',
      headers: [['destination', 'foo'], ['message-id', '456']],
      body: ''
    });

    const msg2 = "MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0";

    parser.parseChunk(msg2);

    expect(onFrame.calls.mostRecent().args[0]).toEqual({
      command: 'MESSAGE',
      headers: [['destination', 'bar'], ['message-id', '203']],
      body: 'Hello World'
    });
  });

  it("Should parse multiple frames in one chunk", function () {
    const msg = "MESSAGE\ndestination:foo\nmessage-id:456\n\n\0";
    const msg2 = "MESSAGE\ndestination:bar\nmessage-id:203\n\nHello World\0";

    parser.parseChunk(msg + msg2);

    expect(onFrame.calls.first().args[0]).toEqual({
      command: 'MESSAGE',
      headers: [['destination', 'foo'], ['message-id', '456']],
      body: ''
    });

    expect(onFrame.calls.mostRecent().args[0]).toEqual({
      command: 'MESSAGE',
      headers: [['destination', 'bar'], ['message-id', '203']],
      body: 'Hello World'
    });
  });

  it("Should recognize incoming pings", function () {
    const msg = "\nMESSAGE\ndestination:foo\nmessage-id:456\n\n\0";
    parser.parseChunk(msg);

    expect(onIncomingPing).toHaveBeenCalled();
    expect(onFrame).toHaveBeenCalled();

    parser.parseChunk("\n");
    parser.parseChunk("\n");

    expect(onIncomingPing.calls.count()).toBe(3);
  });

  it("Should ignore CR while recognizing incoming pings", function () {
    const msg = "\r\nMESSAGE\r\ndestination:foo\r\nmessage-id:456\r\n\r\n\0";
    parser.parseChunk(msg);

    expect(onIncomingPing).toHaveBeenCalled();
    expect(onFrame).toHaveBeenCalled();

    parser.parseChunk("\r\n");
    parser.parseChunk("\r\n");

    expect(onIncomingPing.calls.count()).toBe(3);
  })

});

