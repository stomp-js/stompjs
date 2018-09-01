describe("Stomp Frame", function () {

  it("escape header value", function () {
    const out = StompJs.Frame.frEscape("anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\");
    expect(out).toEqual("anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\");
  });

  it("escapes and then unescapes header value to give original string", function () {
    const orig = "anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\";
    const out = StompJs.Frame.frUnEscape(StompJs.Frame.frEscape(orig));
    expect(out).toEqual(orig);
  });

  it("marshall a CONNECT frame", function () {
    const out = StompJs.Frame.marshall({command: "CONNECT", headers: {login: 'jmesnil', passcode: 'wombats'}});
    expect(out).toEqual("CONNECT\nlogin:jmesnil\npasscode:wombats\n\n\0");
  });

  it("marshall a SEND frame", function () {
    const out = StompJs.Frame.marshall({command: "SEND", headers: {destination: '/queue/test'}, body: "hello, world!"});
    expect(out).toEqual("SEND\ndestination:/queue/test\ncontent-length:13\n\nhello, world!\0");
  });

  it("marshall a SEND frame without content-length", function () {
    const out = StompJs.Frame.marshall({
      command: "SEND",
      headers: {destination: '/queue/test'},
      body: "hello, world!",
      skipContentLengthHeader: true
    });
    expect(out).toEqual("SEND\ndestination:/queue/test\n\nhello, world!\0");
  });

  it("unmarshall a CONNECTED frame", function () {
    const data = "CONNECTED\nsession-id: 1234\n\n\0";
    const frame = StompJs.Frame.unmarshall(data).frames[0];
    expect(frame.command).toEqual("CONNECTED");
    expect(frame.headers).toEqual({'session-id': "1234"});
    expect(frame.body).toEqual('');
  });

  it("unmarshall a RECEIVE frame", function () {
    const data = "RECEIVE\nfoo: abc\nbar: 1234\n\nhello, world!\0";
    const frame = StompJs.Frame.unmarshall(data).frames[0];
    expect(frame.command).toEqual("RECEIVE");
    expect(frame.headers).toEqual({foo: 'abc', bar: "1234"});
    expect(frame.body).toEqual("hello, world!");
  });

  it("unmarshall should not include the null byte in the body", function () {
    const body1 = 'Just the text please.',
      body2 = 'And the newline\n',
      msg = "MESSAGE\ndestination: /queue/test\nmessage-id: 123\n\n";

    expect(StompJs.Frame.unmarshall(msg + body1 + '\0').frames[0].body).toEqual(body1);
    expect(StompJs.Frame.unmarshall(msg + body2 + '\0').frames[0].body).toEqual(body2);
  });

  it("unmarshall should support colons (:) in header values", function () {
    const dest = 'foo:bar:baz',
      msg = "MESSAGE\ndestination: " + dest + "\nmessage-id: 456\n\n\0";

    expect(StompJs.Frame.unmarshall(msg).frames[0].headers.destination).toEqual(dest);
  });

  it("unmarshall should support colons (:) in header values with escaping", function () {
    const dest = 'foo:bar:baz',
      msg = "MESSAGE\ndestination: " + 'foo\\cbar\\cbaz' + "\nmessage-id: 456\n\n\0";

    expect(StompJs.Frame.unmarshall(msg, true).frames[0].headers.destination).toEqual(dest);
  });

  it("unmarshall should support \\, \\n and \\r in header values with escaping", function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
      msg = "MESSAGE\ndestination: " + 'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' + "\nmessage-id: 456\n\n\0";

    expect(StompJs.Frame.unmarshall(msg, true).frames[0].headers.destination).toEqual(dest);
  });

  it("marshall should support \\, \\n and \\r in header values with escaping", function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
      msg = "MESSAGE\ndestination:" + 'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' + "\nmessage-id:456\n\n\0";

    expect(StompJs.Frame.marshall({
      command: "MESSAGE",
      headers: {"destination": dest, "message-id": "456"},
      body: "",
      escapeHeaderValues: true
    })).toEqual(msg);
  });

  it("marshal/unmarshall should support \\, \\n and \\r in header values with escaping", function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';
    const command = "MESSAGE";
    const headers = {"destination": dest, "message-id": "456"};
    const body = "";

    const msg = StompJs.Frame.marshall({command: command, headers: headers, body: body, escapeHeaderValues: true});
    const frame = StompJs.Frame.unmarshall(msg, true).frames[0];

    expect(frame.headers).toEqual(headers);
  });

  it("only the 1st value of repeated headers is used", function () {
    const msg = "MESSAGE\ndestination: /queue/test\nfoo:World\nfoo:Hello\n\n\0";

    expect(StompJs.Frame.unmarshall(msg).frames[0].headers['foo']).toEqual('World');
  });

  it("Content length of UTF-8 strings", function () {
    expect(0).toEqual(StompJs.Frame.sizeOfUTF8());
    expect(0).toEqual(StompJs.Frame.sizeOfUTF8(""));
    expect(1).toEqual(StompJs.Frame.sizeOfUTF8("a"));
    expect(2).toEqual(StompJs.Frame.sizeOfUTF8("ф"));
    expect(3).toEqual(StompJs.Frame.sizeOfUTF8("№"));
    expect(15).toEqual(StompJs.Frame.sizeOfUTF8("1 a ф № @ ®"));
  });

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
    })

  });

});
