import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import { FrameImpl, Parser } from '../../src/index.js';

test.describe('Stomp FrameImpl', () => {
  // un-marshall a data chunk, for ease of matching body is converted to string
  const unmarshall = (data: string, escapeHeaderValues?: boolean): any => {
    const onFrame = sinon.spy();
    const onIncomingPing = sinon.spy();
    const parser = new Parser(onFrame, onIncomingPing);

    parser.parseChunk(data);

    const rawFrame = onFrame.firstCall.args[0];
    return (FrameImpl as any).fromRawFrame(rawFrame, escapeHeaderValues);
  };

  test('escape header value', () => {
    const out = (FrameImpl as any).hdrValueEscape(
      'anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\',
    );
    expect(out).toEqual(
      'anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\',
    );
  });

  test('escapes and then unescapes header value to give original string', () => {
    const orig = 'anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\';
    const out = (FrameImpl as any).hdrValueUnEscape(
      (FrameImpl as any).hdrValueEscape(orig),
    );
    expect(out).toEqual(orig);
  });

  test('marshall a CONNECT frame', () => {
    const out = (FrameImpl as any).marshall({
      command: 'CONNECT',
      headers: { login: 'jmesnil', passcode: 'wombats' },
    });
    expect(out).toEqual('CONNECT\nlogin:jmesnil\npasscode:wombats\n\n\0');
  });

  test('marshall a SEND frame', () => {
    const out = (FrameImpl as any).marshall({
      command: 'SEND',
      headers: { destination: '/queue/test' },
      body: 'hello, world!',
    });
    expect(out).toEqual(
      'SEND\ndestination:/queue/test\ncontent-length:13\n\nhello, world!\0',
    );
  });

  test('marshall a SEND frame without content-length', () => {
    const out = (FrameImpl as any).marshall({
      command: 'SEND',
      headers: { destination: '/queue/test' },
      body: 'hello, world!',
      skipContentLengthHeader: true,
    });
    expect(out).toEqual('SEND\ndestination:/queue/test\n\nhello, world!\0');
  });

  test('unmarshall a CONNECTED frame', () => {
    const data = 'CONNECTED\nsession-id: 1234\n\n\0';
    const frame = unmarshall(data);
    expect(frame.command).toEqual('CONNECTED');
    expect(frame.headers).toEqual({ 'session-id': '1234' });
    expect(frame.body).toEqual('');
  });

  test('unmarshall a RECEIVE frame', () => {
    const data = 'RECEIVE\nfoo: abc\nbar: 1234\n\nhello, world!\0';
    const frame = unmarshall(data);
    expect(frame.command).toEqual('RECEIVE');
    expect(frame.headers).toEqual({ foo: 'abc', bar: '1234' });
    expect(frame.body).toEqual('hello, world!');
  });

  test('unmarshall should not include the null byte in the body', () => {
    const body1 = 'Just the text please.',
      body2 = 'And the newline\n',
      msg = 'MESSAGE\ndestination: /queue/test\nmessage-id: 123\n\n';

    expect(unmarshall(msg + body1 + '\0').body).toEqual(body1);
    expect(unmarshall(msg + body2 + '\0').body).toEqual(body2);
  });

  test('unmarshall should support colons (:) in header values', () => {
    const dest = 'foo:bar:baz',
      msg = 'MESSAGE\ndestination: ' + dest + '\nmessage-id: 456\n\n\0';

    expect(unmarshall(msg).headers.destination).toEqual(dest);
  });

  test('unmarshall should support colons (:) in header values with escaping', () => {
    const dest = 'foo:bar:baz',
      msg =
        'MESSAGE\ndestination: ' +
        'foo\\cbar\\cbaz' +
        '\nmessage-id: 456\n\n\0';

    expect(unmarshall(msg, true).headers.destination).toEqual(dest);
  });

  test('unmarshall should support \\, \\n and \\r in header values with escaping', () => {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
      msg =
        'MESSAGE\ndestination: ' +
        'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' +
        '\nmessage-id: 456\n\n\0';

    expect(unmarshall(msg, true).headers.destination).toEqual(dest);
  });

  test('marshall should support \\, \\n and \\r in header values with escaping', () => {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
      msg =
        'MESSAGE\ndestination:' +
        'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' +
        '\nmessage-id:456\n\n\0';

    expect(
      (FrameImpl as any).marshall({
        command: 'MESSAGE',
        headers: { destination: dest, 'message-id': '456' },
        body: '',
        escapeHeaderValues: true,
      }),
    ).toEqual(msg);
  });

  test('marshal/unmarshall should support \\, \\n and \\r in header values with escaping', () => {
    const dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';
    const command = 'MESSAGE';
    const headers = { destination: dest, 'message-id': '456' };
    const body = '';

    const msg = (FrameImpl as any).marshall({
      command: command,
      headers: headers,
      body: body,
      escapeHeaderValues: true,
    });
    const frame = unmarshall(msg, true);

    expect(frame.headers).toEqual(headers);
  });

  test('only the 1st value of repeated headers is used', () => {
    const msg = 'MESSAGE\ndestination: /queue/test\nfoo:World\nfoo:Hello\n\n\0';

    expect(unmarshall(msg).headers['foo']).toEqual('World');
  });

  test('Content length of UTF-8 strings', () => {
    expect(0).toEqual((FrameImpl as any).sizeOfUTF8());
    expect(0).toEqual((FrameImpl as any).sizeOfUTF8(''));
    expect(1).toEqual((FrameImpl as any).sizeOfUTF8('a'));
    expect(2).toEqual((FrameImpl as any).sizeOfUTF8('ф'));
    expect(3).toEqual((FrameImpl as any).sizeOfUTF8('№'));
    expect(15).toEqual((FrameImpl as any).sizeOfUTF8('1 a ф № @ ®'));
  });
});
