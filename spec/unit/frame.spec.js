describe('Stomp FrameImpl', function () {
  // un-marshall a data chunk, for ease of matching body is converted to string
  const unmarshall = function (data, escapeHeaderValues) {
    const onFrame = jasmine.createSpy('onFrame');
    const onIncomingPing = jasmine.createSpy('onIncomingPing');
    const parser = new StompJs.Parser(onFrame, onIncomingPing);

    parser.parseChunk(data);

    const rawFrame = onFrame.calls.first().args[0];
    return StompJs.FrameImpl.fromRawFrame(rawFrame, escapeHeaderValues);
  };

  it('escape header value', function () {
    const out = StompJs.FrameImpl.hdrValueEscape(
      'anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\'
    );
    expect(out).toEqual(
      'anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\'
    );
  });

  it('escapes and then unescapes header value to give original string', function () {
    const orig = 'anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\';
    const out = StompJs.FrameImpl.hdrValueUnEscape(
      StompJs.FrameImpl.hdrValueEscape(orig)
    );
    expect(out).toEqual(orig);
  });

  it('marshall a CONNECT frame', function () {
    const out = StompJs.FrameImpl.marshall({
      command: 'CONNECT',
      headers: { login: 'jmesnil', passcode: 'wombats' },
    });
    expect(out).toEqual('CONNECT\nlogin:jmesnil\npasscode:wombats\n\n\0');
  });

  it('marshall a SEND frame', function () {
    const out = StompJs.FrameImpl.marshall({
      command: 'SEND',
      headers: { destination: '/queue/test' },
      body: 'hello, world!',
    });
    expect(out).toEqual(
      'SEND\ndestination:/queue/test\ncontent-length:13\n\nhello, world!\0'
    );
  });

  it('marshall a SEND frame without content-length', function () {
    const out = StompJs.FrameImpl.marshall({
      command: 'SEND',
      headers: { destination: '/queue/test' },
      body: 'hello, world!',
      skipContentLengthHeader: true,
    });
    expect(out).toEqual('SEND\ndestination:/queue/test\n\nhello, world!\0');
  });

  it('unmarshall a CONNECTED frame', function () {
    const data = 'CONNECTED\nsession-id: 1234\n\n\0';
    const frame = unmarshall(data);
    expect(frame.command).toEqual('CONNECTED');
    expect(frame.headers).toEqual({ 'session-id': '1234' });
    expect(frame.body).toEqual('');
  });

  it('unmarshall a RECEIVE frame', function () {
    const data = 'RECEIVE\nfoo: abc\nbar: 1234\n\nhello, world!\0';
    const frame = unmarshall(data);
    expect(frame.command).toEqual('RECEIVE');
    expect(frame.headers).toEqual({ foo: 'abc', bar: '1234' });
    expect(frame.body).toEqual('hello, world!');
  });

  it('unmarshall should not include the null byte in the body', function () {
    const body1 = 'Just the text please.',
      body2 = 'And the newline\n',
      msg = 'MESSAGE\ndestination: /queue/test\nmessage-id: 123\n\n';

    expect(unmarshall(msg + body1 + '\0').body).toEqual(body1);
    expect(unmarshall(msg + body2 + '\0').body).toEqual(body2);
  });

  it('unmarshall should support colons (:) in header values', function () {
    const dest = 'foo:bar:baz',
      msg = 'MESSAGE\ndestination: ' + dest + '\nmessage-id: 456\n\n\0';

    expect(unmarshall(msg).headers.destination).toEqual(dest);
  });

  it('unmarshall should support colons (:) in header values with escaping', function () {
    const dest = 'foo:bar:baz',
      msg =
        'MESSAGE\ndestination: ' +
        'foo\\cbar\\cbaz' +
        '\nmessage-id: 456\n\n\0';

    expect(unmarshall(msg, true).headers.destination).toEqual(dest);
  });

  it('unmarshall should support \\, \\n and \\r in header values with escaping', function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
      msg =
        'MESSAGE\ndestination: ' +
        'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' +
        '\nmessage-id: 456\n\n\0';

    expect(unmarshall(msg, true).headers.destination).toEqual(dest);
  });

  it('marshall should support \\, \\n and \\r in header values with escaping', function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
      msg =
        'MESSAGE\ndestination:' +
        'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' +
        '\nmessage-id:456\n\n\0';

    expect(
      StompJs.FrameImpl.marshall({
        command: 'MESSAGE',
        headers: { destination: dest, 'message-id': '456' },
        body: '',
        escapeHeaderValues: true,
      })
    ).toEqual(msg);
  });

  it('marshal/unmarshall should support \\, \\n and \\r in header values with escaping', function () {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';
    const command = 'MESSAGE';
    const headers = { destination: dest, 'message-id': '456' };
    const body = '';

    const msg = StompJs.FrameImpl.marshall({
      command: command,
      headers: headers,
      body: body,
      escapeHeaderValues: true,
    });
    const frame = unmarshall(msg, true);

    expect(frame.headers).toEqual(headers);
  });

  it('only the 1st value of repeated headers is used', function () {
    const msg = 'MESSAGE\ndestination: /queue/test\nfoo:World\nfoo:Hello\n\n\0';

    expect(unmarshall(msg).headers['foo']).toEqual('World');
  });

  it('Content length of UTF-8 strings', function () {
    expect(0).toEqual(StompJs.FrameImpl.sizeOfUTF8());
    expect(0).toEqual(StompJs.FrameImpl.sizeOfUTF8(''));
    expect(1).toEqual(StompJs.FrameImpl.sizeOfUTF8('a'));
    expect(2).toEqual(StompJs.FrameImpl.sizeOfUTF8('ф'));
    expect(3).toEqual(StompJs.FrameImpl.sizeOfUTF8('№'));
    expect(15).toEqual(StompJs.FrameImpl.sizeOfUTF8('1 a ф № @ ®'));
  });
});
