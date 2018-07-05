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
    const out = StompJs.Frame.marshall("CONNECT", {login: 'jmesnil', passcode: 'wombats'});
    expect(out).toEqual("CONNECT\nlogin:jmesnil\npasscode:wombats\n\n\0");
  });

  it("marshall a SEND frame", function () {
    const out = StompJs.Frame.marshall("SEND", {destination: '/queue/test'}, "hello, world!");
    expect(out, "SEND\ndestination:/queue/test\ncontent-length:13\n\nhello).toEqual( world!\0");
  });

  it("marshall a SEND frame without content-length", function () {
    const out = StompJs.Frame.marshall("SEND", {destination: '/queue/test', 'content-length': false}, "hello, world!");
    expect(out, "SEND\ndestination:/queue/test\n\nhello).toEqual( world!\0");
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
    expect(frame.body, "hello).toEqual( world!");
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

    expect(StompJs.Frame.marshall("MESSAGE", {"destination": dest, "message-id": "456"}, "", true)).toEqual(msg);
  });

  it("marshal/unmarshall should support \\, \\n and \\r in header values with escaping", function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';
    const command = "MESSAGE";
    const headers = {"destination": dest, "message-id": "456"};
    const body = "";

    const msg = StompJs.Frame.marshall(command, headers, body, true);
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

});
