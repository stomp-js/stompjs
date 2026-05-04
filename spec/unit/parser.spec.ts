import { test } from '@playwright/test';
import { expect, StompJs, createSpy, generateBinaryData } from '../helpers/setup.js';

function toUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function toArrayBuffer(cmdAndHeaders: string, binaryBody: Uint8Array): ArrayBuffer {
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

const { describe, beforeEach } = test;

describe('Neo Parser', () => {
  let onFrame: any;
  let onIncomingPing: any;
  let parser: any;

  beforeEach(() => {
    onFrame = createSpy('onFrame');
    onIncomingPing = createSpy('onIncomingPing');
    parser = new StompJs.Parser(onFrame, onIncomingPing);
  });

  describe('Basic', () => {
    test('parses a simple Frame', () => {
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

    test('parses a simple Frame given as ArrayBuffer', () => {
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

    test('handles header value with :', () => {
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

    test('handles header with empty value', () => {
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

    test('parses a Frame without headers or binaryBody', () => {
      const msg = 'MESSAGE\n\n\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [],
        binaryBody: toUint8Array(''),
      });
    });

    test('parses a simple Frame spread in multiple chunks', () => {
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

    test('parses multiple frames, single frame in each chunk', () => {
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

    test('parses multiple frames in single chunk', () => {
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

  describe('Incoming Ping', () => {
    test('recognizes incoming pings', () => {
      parser.parseChunk('\n');
      expect(onIncomingPing).toHaveBeenCalled();

      parser.parseChunk('MESSAGE\ndestination:foo\nmessage-id:456\n\n\0');
      expect(onFrame).toHaveBeenCalled();

      parser.parseChunk('\n');
      parser.parseChunk('\n');

      expect(onIncomingPing.calls.count()).toBe(3);
    });

    test('ignores CR in incoming pings', () => {
      const msg = '\r\nMESSAGE\r\ndestination:foo\r\nmessage-id:456\r\n\r\n\0';
      parser.parseChunk(msg);

      expect(onIncomingPing).toHaveBeenCalled();
      expect(onFrame).toHaveBeenCalled();

      parser.parseChunk('\r\n');
      parser.parseChunk('\r\n');

      expect(onIncomingPing.calls.count()).toBe(3);
    });
  });

  describe('Text body', () => {
    test('parses a Frame with body', () => {
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

    test('ignores CR while parsing a Frame with body', () => {
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

    test('parses a Frame without headers', () => {
      const msg = 'MESSAGE\n\nHello World\0';

      parser.parseChunk(msg);

      expect(onFrame).toHaveBeenCalledWith({
        command: 'MESSAGE',
        headers: [],
        binaryBody: toUint8Array('Hello World'),
      });
    });
  });

  describe('Binary body', () => {
    let binaryBody: Uint8Array;
    let commandAndHeaders: string;
    let rawChunk: ArrayBuffer;

    const verifyRawFrame = (rawFrame: any) => {
      expect(rawFrame.command).toEqual('SEND');
      expect(rawFrame.headers).toEqual([
        ['destination', 'foo'],
        ['message-id', '456'],
        ['content-length', '1024'],
      ]);
      expect(rawFrame.binaryBody.toString()).toEqual(binaryBody.toString());
    };

    beforeEach(() => {
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

    test('handles binary octets in body', () => {
      parser.parseChunk(rawChunk);

      const rawFrame = onFrame.calls.first().args[0];
      verifyRawFrame(rawFrame);
    });

    test('handles multiple binary frames', () => {
      parser.parseChunk(rawChunk);
      parser.parseChunk(rawChunk);
      parser.parseChunk(rawChunk);

      expect(onFrame.calls.count()).toEqual(3);
      const rawFrame = onFrame.calls.mostRecent().args[0];

      verifyRawFrame(rawFrame);
    });

    test('handles binary frame is split chunks', () => {
      parser.parseChunk(rawChunk.slice(0, 200));
      parser.parseChunk(rawChunk.slice(200, 500));
      parser.parseChunk(rawChunk.slice(500, rawChunk.byteLength));

      const rawFrame = onFrame.calls.first().args[0];

      verifyRawFrame(rawFrame);
    });

    test('handles mixed text and binary chunks', () => {
      parser.parseChunk(commandAndHeaders); // Text chunk
      parser.parseChunk(binaryBody.buffer); // Array buffer chunk, binary octets
      parser.parseChunk('\0'); // Text chunk

      const rawFrame = onFrame.calls.first().args[0];

      verifyRawFrame(rawFrame);
    });

    test('waits for trailing NULL before yielding frame', () => {
      parser.parseChunk(rawChunk.slice(0, rawChunk.byteLength - 1)); // Excluding the terminating NULL

      expect(onFrame).not.toHaveBeenCalled();

      parser.parseChunk(new Uint8Array([0]).buffer); // terminating NULL

      expect(onFrame).toHaveBeenCalled();
    });

    test('handles text and binary frames with incoming pings', () => {
      parser.parseChunk('MESSAGE\ndestination:foo\nmessage-id:456\n\n\0');
      parser.parseChunk('\n');
      parser.parseChunk('\n');
      parser.parseChunk(rawChunk);
      parser.parseChunk('\n');

      expect(onFrame.calls.count()).toEqual(2);
      expect(onIncomingPing.calls.count()).toEqual(3);

      const rawFrame = onFrame.calls.mostRecent().args[0];
      verifyRawFrame(rawFrame);
    });
  });
});
