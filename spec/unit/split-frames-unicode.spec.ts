import { expect, test } from '@playwright/test';
import { Client, FrameImpl, StompConfig } from '../../src/index.js';
import { IStompSocket } from '../../src/types.js';

// Each text send is encoded separately, as it is by a WebSocket transport.
class RecordingSocket implements IStompSocket {
  public url = 'ws://test.invalid';
  public readyState = 0;
  public binaryType = 'arraybuffer';
  public onopen: IStompSocket['onopen'] = null;
  public onclose: IStompSocket['onclose'] = null;
  public onerror: IStompSocket['onerror'] = null;
  public onmessage: IStompSocket['onmessage'] = null;
  public sent: Parameters<IStompSocket['send']>[0][] = [];
  public wire: Uint8Array[] = [];
  private pending = '';

  constructor() {
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }

  public send(data: Parameters<IStompSocket['send']>[0]): void {
    const bytes =
      typeof data === 'string'
        ? new TextEncoder().encode(data)
        : ArrayBuffer.isView(data)
          ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
          : new Uint8Array(data as ArrayBuffer);
    this.sent.push(data);
    this.wire.push(bytes);
    this.pending += new TextDecoder().decode(bytes);
    if (
      this.pending.endsWith('\0') &&
      (this.pending.startsWith('CONNECT\n') ||
        this.pending.startsWith('STOMP\n'))
    ) {
      this.pending = '';
      queueMicrotask(() =>
        this.onmessage?.({
          data: 'CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0',
        }),
      );
    }
  }

  public close(): void {
    this.readyState = 3;
    this.onclose?.({ code: 1000, reason: '', wasClean: true });
  }
}

const destination = '/queue/unicode';

function expectedFrame(body: string): string {
  return FrameImpl.marshall({
    command: 'SEND',
    headers: { destination },
    body,
    escapeHeaderValues: true,
  }) as string;
}

async function connectedClient(options: StompConfig) {
  let socket: RecordingSocket;
  const client = new Client({
    reconnectDelay: 0,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    splitLargeFrames: true,
    ...options,
    webSocketFactory: () => (socket = new RecordingSocket()),
  });
  const connected = new Promise<void>(resolve => {
    client.onConnect = () => resolve();
  });
  client.activate();
  await connected;
  socket!.sent = [];
  socket!.wire = [];
  return { client, socket: socket! };
}

function wireText(socket: RecordingSocket): string {
  const length = socket.wire.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of socket.wire) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

test.describe('split text frames with Unicode', () => {
  for (const size of [2, 3, 8192]) {
    for (const character of ['😀', '𝄞']) {
      test(`preserves ${character} across a ${size}-unit boundary`, async () => {
        const { client, socket } = await connectedClient({
          maxWebSocketChunkSize: size,
        });
        try {
          let body = '';
          for (let padding = 0; padding < size; padding++) {
            const candidate = 'a'.repeat(padding) + character + 'tail';
            if (
              expectedFrame(candidate).indexOf(character) % size ===
              size - 1
            ) {
              body = candidate;
              break;
            }
          }
          expect(body).not.toBe('');
          client.publish({ destination, body });
          expect(wireText(socket)).toBe(expectedFrame(body));
          expect(socket.sent.length).toBeGreaterThan(1);
          for (const chunk of socket.sent) {
            expect(typeof chunk).toBe('string');
            expect((chunk as string).length).toBeGreaterThan(0);
            expect((chunk as string).length).toBeLessThanOrEqual(size);
          }
        } finally {
          await client.deactivate({ force: true });
        }
      });
    }
  }

  for (const body of ['😀tail', 'middle😀tail', 'tail😀']) {
    test(`rejects one-unit chunks before sending ${body}`, async () => {
      const { client, socket } = await connectedClient({
        maxWebSocketChunkSize: 1,
      });
      try {
        expect(() => client.publish({ destination, body })).toThrow(RangeError);
        expect(socket.sent).toHaveLength(0);
        expect(socket.wire).toHaveLength(0);
        client.publish({ destination, body: 'safe ASCII' });
        expect(wireText(socket)).toBe(expectedFrame('safe ASCII'));
      } finally {
        await client.deactivate({ force: true });
      }
    });
  }

  test('checks headers before sending any part of a one-unit frame', async () => {
    const { client, socket } = await connectedClient({
      maxWebSocketChunkSize: 1,
    });
    try {
      expect(() =>
        client.publish({
          destination,
          headers: { label: '😀' },
          body: 'ASCII',
        }),
      ).toThrow(RangeError);
      expect(socket.sent).toHaveLength(0);
    } finally {
      await client.deactivate({ force: true });
    }
  });

  for (const body of ['ASCII', 'é漢字', '\ud800x\udc00']) {
    test(`preserves existing text encoding for ${JSON.stringify(body)}`, async () => {
      const { client, socket } = await connectedClient({
        maxWebSocketChunkSize: 1,
      });
      try {
        client.publish({ destination, body });
        const encoded = new TextEncoder().encode(expectedFrame(body));
        expect(wireText(socket)).toBe(new TextDecoder().decode(encoded));
        expect(socket.sent.every(chunk => (chunk as string).length === 1)).toBe(
          true,
        );
      } finally {
        await client.deactivate({ force: true });
      }
    });
  }

  for (const options of [
    { splitLargeFrames: false },
    { forceBinaryWSFrames: true },
  ]) {
    test(`does not change the unsplit path ${JSON.stringify(options)}`, async () => {
      const { client, socket } = await connectedClient({
        maxWebSocketChunkSize: 1,
        ...options,
      });
      try {
        client.publish({ destination, body: '😀' });
        expect(wireText(socket)).toBe(expectedFrame('😀'));
        expect(socket.sent).toHaveLength(1);
        expect(typeof socket.sent[0] === 'string').toBe(
          !options.forceBinaryWSFrames,
        );
      } finally {
        await client.deactivate({ force: true });
      }
    });
  }

  test('does not split a binary body', async () => {
    const { client, socket } = await connectedClient({
      maxWebSocketChunkSize: 1,
    });
    try {
      const bytes = new TextEncoder().encode('😀');
      client.publish({ destination, binaryBody: bytes });
      expect(socket.sent).toHaveLength(1);
      expect(typeof socket.sent[0]).not.toBe('string');
      expect(wireText(socket)).toBe(expectedFrame('😀'));
    } finally {
      await client.deactivate({ force: true });
    }
  });
});
