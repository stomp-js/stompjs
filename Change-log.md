# Change Log

# 6.1.2 (2021-09-03)

- One more attempt to fix [#366](https://github.com/stomp-js/stompjs/issues/366),
  include sourcemap and source into the npm bundle.

# 6.1.1 (2021-08-27)

- Bug fix in connectionTimeout. Thanks to [Sailai](https://github.com/sailai).
  See [#368](https://github.com/stomp-js/stompjs/pull/368).
- Exlude source map files from npm package,
  See [#366](https://github.com/stomp-js/stompjs/issues/366)

# 6.1.0 (2021-02-24)

- Disable connectionTimeout by default.
  Bypasses [rx-stomp#277](https://github.com/stomp-js/rx-stomp/issues/277)
  and [ng2-stompjs#218](https://github.com/stomp-js/ng2-stompjs/issues/218).

# 6.0.0 (2020-10-22)

- Switch to `es2015` output target.
  Resolves [#288](https://github.com/stomp-js/stompjs/issues/288).
- Use Node 14 for few of the CI tests.
- Make `Client#deactivate` async. Removes potential race cases.
- New configuration option `connectionTimeout`.
  The client will retry to connect if the connection is not established
  before `connectionTimeout`.
  See [#165](https://github.com/stomp-js/stompjs/issues/165).
- Remove dom lib dependency for usage with NodeJS/Typescript.
  See [#224](https://github.com/stomp-js/stompjs/pull/224).
- Drop ES5 module output, target ES2017 instead of ES6 for modules.
- Concept of `discardWebsocketOnCommFailure`.
  See: [#247](https://github.com/stomp-js/stompjs/issues/247).
- Test cases pass with RabbitMQ 3.8.8.
  See: [#280](https://github.com/stomp-js/stompjs/pull/280).
- Refactor Travis setup.
- Use Node 10 & 12 at Travis.
- Start using RabbitMQ 3.8.8 at Travis.
- Configure Github actions - test Safari and Edge on OSX,
  test Firefox and Chrome on Linux.

# 5.4.4 (2020-03-24)

- Improve test cases for ack/nack.
- Defensively ignore messages before closing underlying web socket.
  Attempt to fix [#213](https://github.com/stomp-js/stompjs/issues/213).

# 5.4.3 (2020-01-23)

- Allow server to not send heart-beat header with CONNECTED frame.
  Fixes [#188](https://github.com/stomp-js/stompjs/issues/188).

# 5.4.2 (2019-06-12)

- Some constants were used through `WebSocket` class, which failed in NodeJS.
  Constants locally created to remove dependency.
  Fixes [#119](https://github.com/stomp-js/stompjs/issues/119)
- Warn if a plain socket (instead of a factory) is passed to `Stomp.over`.

# 5.4.1 (2019-06-10)

- Test cases for appendMissingNULLonIncoming.

# 5.4.0 (2019-04-22)

- Proper fix for [#89](https://github.com/stomp-js/stompjs/issues/89).
  Thanks [Dimitar Georgiev](https://github.com/iMitaka)
  for [PR #104](https://github.com/stomp-js/stompjs/pull/104)

# 5.3.0 (2019-04-04)

- Concept of appendMissingNULLonIncoming, workaround for
  [#89](https://github.com/stomp-js/stompjs/issues/89).

# 5.2.0 (2019-01-17)

- Promoting 5.2.0-beta.1 as 5.2.0.

# 5.2.0-beta.1 (2019-01-15)

- Send ping only if WebSocket is connected.
- Concept of splitLargeFrames flag.
  Working towards [ng2-stompjs#120](https://github.com/stomp-js/ng2-stompjs/issues/120)
- Concept of forceBinaryWSFrames.

# 5.1.0 (2018-12-16)

- Promoting 5.1.0-beta.1 as 5.1.0.

# 5.1.0-beta.1 (2018-12-09)

- See issues marked for [v5.1.0](https://github.com/stomp-js/stompjs/issues?utf8=%E2%9C%93&q=is%3Aissue+milestone%3A5.1.0).
- Using [dependbot](https://dependabot.com/) to keep dependencies up to date.
- Concept of onWebSocketError, fixes [#21](https://github.com/stomp-js/stompjs/issues/21).
- Support for Asynchronous beforeConnect. Fixes [#14](https://github.com/stomp-js/stompjs/issues/14).
- Travis now checks out rx-stomp & ng2-stompjs and runs tests in those against this version
  of the library. To avoid issues like
  [ng2-stompjs-angular7/issues/2](https://github.com/stomp-js/ng2-stompjs-angular7/issues/2).
- Some entities which should have been exported as Interfaces were exported as Classes.
  This might cause type mis-match issues if any of the private members change in any of
  the implementation. Concept of IFrame, IMessage, ITransaction interfaces introduced.
  Fixes [#25](https://github.com/stomp-js/stompjs/issues/25).
- Updated Webpack config as per
  [webpack/issues/6525#issuecomment-417580843](https://github.com/webpack/webpack/issues/6525#issuecomment-417580843)
  to resolve [#26](https://github.com/stomp-js/stompjs/issues/26).
- Dependencies updated as per [dependbot](https://dependabot.com/).
- Ability to log raw communication with broker.
  Fixes: [#29](https://github.com/stomp-js/stompjs/issues/29).

# 5.0.2 (2018-11-26)

- Emergency release - added `publishParams` back.
  Should fix [ng2-stompjs-angular7/issues/2](https://github.com/stomp-js/ng2-stompjs-angular7/issues/2)

## 5.0.1 (2018-11-25)

- Configured `tslint`. `src` is `tslint` clean.
- Update of disconnectHeaders take effect from subsequent disconnect.
  Fixes [#27](https://github.com/stomp-js/stompjs/issues/27).
- This library does not alter passed connect and disconnect header objects any longer.

## 5.0.0 (2018-10-19)

- Same as 5.0.0-beta.5

## 5.0.0-beta.5 (2018-10-19)

- Any function must not change `headers` received as parameter, should fix [#11](https://github.com/stomp-js/stompjs/issues/11)

## 5.0.0-beta.4 (2018-10-01)

- Change Uint8Array forEach to regular access using [], should fix [#12](https://github.com/stomp-js/stompjs/issues/12)

## 5.0.0-beta.3 (2018-09-25)

- Allowed STOMP versions is now configurable
- renamed `version` --> `connectedVersion`
- for large message tests, make size configurable

## 5.0.0-beta.2 (2018/09/18)

- added `forceDisconnect`
- deprecate maxWebSocketFrameSize
- new API for binary messages
- beforeConnect callback

## 5.0.0-beta.1 (2018/09/15)

- Shift to Typescript, Jasmine, Karma, Webpack and compodoc
- 3 variants of complied files - ES5, ES6 and UMD
- Convert all callbacks to get/set options
- Rationalized parameters for constructor, connect, disconnect and send.
  To support older semantics in legacy mode, renamed APIs (see Upgrade guide for details).
- Brand new evented, streaming, rec descent parser - 100% faithful protocol implementation.
- Binary payload support.
- Support for large frames.
- Upgrade guides.

## 4.0.6 (2018/05/26)

- Updates in typescript definitions, Thanks [Raul](https://github.com/rulonder),
  see: [#39](https://github.com/stomp-js/stomp-websocket/pull/39)

## 4.0.5

- Ignore - incomplete release

## 4.0.4 (2018/05/22)

- GWT Compatibility, fixes [#38](https://github.com/stomp-js/stomp-websocket/issues/38)

## 4.0.3 (2018/05/09)

- Add to Bower, fixes [#26](https://github.com/stomp-js/stomp-websocket/issues/26)
- Several documentation cleanup, fixes [#27](https://github.com/stomp-js/stomp-websocket/issues/27)
- Updated typescript definitions, Thanks [Jimi Charalampidis](https://github.com/jimic).
  See: [#33](https://github.com/stomp-js/stomp-websocket/pull/33)
- I need to be more disciplined. Caught up on ChangeLog updates :)

## 4.0.2 (2018/02/23)

- Dockerfile for RabbitMQ. Thanks [Dillon Sellars](https://github.com/dillon-sellars).
  See: [#22](https://github.com/stomp-js/stomp-websocket/pull/22)
- Add closeEventCallback to expose the websocket CloseEvent.
  Thanks [Dillon Sellars](https://github.com/dillon-sellars).
  See: [#23](https://github.com/stomp-js/stomp-websocket/pull/23)
- Cleanup disconnect code, fixes [#21](https://github.com/stomp-js/stomp-websocket/issues/21)

## 4.0.1 (2018/01/29)

- Fixes [#20](https://github.com/stomp-js/stomp-websocket/issues/20)

## 4.0.0 (2017/11/09)

- NodeJS has been upgraded to first class citizen. Dropped legacy support.
- Major version change as this version is not backward compatible.

## 3.1.2 (2017/11/04)

- Header value escaping as per STOMP 1.2 standard.

## 3.1.0 (2017/07/05)

- Updated tests to QUint latest version. Now using same set of tests
  for NodeJS environment.
- Pruned files and folders no longer needed.
- Updated dependencies.
- Updated build scripts.
- Refactored entire documentation.
- Enabled Travis CI (it runs all test cases using NodeJS).
- Documentation is hosted at GitHub pages.
- Updated TypeScript type definitions.

## 2.5.1 (2017/03/28)

- Added typescript definitions. Thanks Jimi Charalampidis (https://github.com/jimic)
- Published on npmjs.com.

## 2.5.0 (2017/02/15)

- Support for auto reconnect
- Minor documentation changes

## 2.4.9 (2016/04/01)

### STOMP 1.2 and RabbitMQ support

- deletion of durable subscriptions
- STOMP 1.2 ack/nack headers
- graceful shutdown

### API change

- the `unsubscribe()` method returned by `subscribe()` now takes an optional
  `headers` argument which can be used to pass headers like `durable:true` and
  `auto-delete:false` required by RabbitMQ to delete durable subscriptions

- for STOMP 1.2, `ack()` and `nack()` methods send an `id` header rather than
  a `message-id` header to match the incoming MESSAGE frame.

- although the `disconnectCallback` is still called immediately after transmitting
  a DISCONNECT frame, the websocket is not closed by the client until a RECEIPT is
  received. Note that due to server-side behaviour with respect to connection lingering
  the RECEIPT may never be received and the socket will be closed by the server.

## 2.0 (2012/11/29)

### STOMP 1.1 support

- heart-beat
- nack
- content-length

### API change

- the `errorCallback` passed to the `connect()` method is no longer called when the
  client is properly disconnected by calling `disconnect()`.

- ack() method takes 3 parameters:

  - `messageID` & `subscription` are MANDATORY.
  - `headers` is OPTIONAL

- the `client` object has a `heartbeat` field which can be used to configure heart-beating by changing its `incoming` and `outgoing` integer fields (default value for both is 10000ms):

  client.heartbeat.outgoing = 20000 // client will send heartbeats every 20000ms
  client.heartbeat.incoming = 0 // client does not want to receive heartbeats
  // from the server

### Minified version

In addition to the regular `stomp.js` file, the library is also available in a minified version `stomp.min.js`

### Annotated source

The source is now [documented](http://jmesnil.net/stomp-websocket/stomp.html) :)
