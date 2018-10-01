# Change Log

## 5.0.0-beta.4 (2018-10-01)

* Change Uint8Array forEach to regular access using [], should fix [#12](https://github.com/stomp-js/stompjs/issues/12)

## 5.0.0-beta.3 (2018-09-25)

* Allowed STOMP versions is now configurable
* renamed `version` --> `connectedVersion`
* for large message tests, make size configurable

## 5.0.0-beta.2 (2018/09/18)

* added `forceDisconnect`
* deprecate maxWebSocketFrameSize
* new API for binary messages
* beforeConnect callback

## 5.0.0-beta.1 (2018/09/15)

* Shift to Typescript, Jasmine, Karma, Webpack and compodoc
* 3 variants of complied files - ES5, ES6 and UMD
* Convert all callbacks to get/set options
* Rationalized parameters for constructor, connect, disconnect and send.
  To support older semantics in legacy mode, renamed APIs (see Upgrade guide for details).
* Brand new evented, streaming, rec descent parser - 100% faithful protocol implementation.
* Binary payload support.
* Support for large frames.
* Upgrade guides.

## 4.0.6 (2018/05/26)

* Updates in typescript definitions, Thanks [Raul](https://github.com/rulonder),
  see: [#39](https://github.com/stomp-js/stomp-websocket/pull/39)

## 4.0.5

* Ignore - incomplete release

## 4.0.4 (2018/05/22)

* GWT Compatibility, fixes [#38](https://github.com/stomp-js/stomp-websocket/issues/38)

## 4.0.3 (2018/05/09)

* Add to Bower, fixes [#26](https://github.com/stomp-js/stomp-websocket/issues/26)
* Several documentation cleanup, fixes [#27](https://github.com/stomp-js/stomp-websocket/issues/27)
* Updated typescript definitions, Thanks [Jimi Charalampidis](https://github.com/jimic).
  See: [#33](https://github.com/stomp-js/stomp-websocket/pull/33)
* I need to be more disciplined. Caught up on ChangeLog updates :)

## 4.0.2 (2018/02/23)

* Dockerfile for RabbitMQ. Thanks [Dillon Sellars](https://github.com/dillon-sellars).
  See: [#22](https://github.com/stomp-js/stomp-websocket/pull/22)
* Add closeEventCallback to expose the websocket CloseEvent.
  Thanks [Dillon Sellars](https://github.com/dillon-sellars).
  See: [#23](https://github.com/stomp-js/stomp-websocket/pull/23)
* Cleanup disconnect code, fixes [#21](https://github.com/stomp-js/stomp-websocket/issues/21)

## 4.0.1 (2018/01/29)

* Fixes [#20](https://github.com/stomp-js/stomp-websocket/issues/20)

## 4.0.0 (2017/11/09)

* NodeJS has been upgraded to first class citizen. Dropped legacy support.
* Major version change as this version is not backward compatible.

## 3.1.2 (2017/11/04)

* Header value escaping as per STOMP 1.2 standard.

## 3.1.0 (2017/07/05)

* Updated tests to QUint latest version. Now using same set of tests
  for NodeJS environment.
* Pruned files and folders no longer needed.
* Updated dependencies.
* Updated build scripts.
* Refactored entire documentation.
* Enabled Travis CI (it runs all test cases using NodeJS).
* Documentation is hosted at GitHub pages.
* Updated TypeScript type definitions.

## 2.5.1 (2017/03/28)

* Added typescript definitions. Thanks Jimi Charalampidis (https://github.com/jimic)
* Published on npmjs.com.

## 2.5.0 (2017/02/15)

* Support for auto reconnect
* Minor documentation changes

## 2.4.9 (2016/04/01)

### STOMP 1.2 and RabbitMQ support

* deletion of durable subscriptions
* STOMP 1.2 ack/nack headers
* graceful shutdown

### API change

* the `unsubscribe()` method returned by `subscribe()` now takes an optional
 `headers` argument which can be used to pass headers like `durable:true` and
 `auto-delete:false` required by RabbitMQ to delete durable subscriptions

* for STOMP 1.2, `ack()` and `nack()` methods send an `id` header rather than
 a `message-id` header to match the incoming MESSAGE frame.

* although the `disconnectCallback` is still called immediately after transmitting
a DISCONNECT frame, the websocket is not closed by the client until a RECEIPT is
received. Note that due to server-side behaviour with respect to connection lingering
the RECEIPT may never be received and the socket will be closed by the server.
## 2.0 (2012/11/29)

### STOMP 1.1 support

* heart-beat
* nack
* content-length

### API change

* the `errorCallback` passed to the `connect()` method is no longer called when the
  client is properly disconnected by calling `disconnect()`.

* ack() method takes 3 parameters:
  * `messageID` & `subscription` are MANDATORY.
  * `headers` is OPTIONAL

* the `client` object has a `heartbeat` field which can be used to configure heart-beating by changing its `incoming` and `outgoing` integer fields (default value for both is 10000ms):

    client.heartbeat.outgoing = 20000 // client will send heartbeats every 20000ms
    client.heartbeat.incoming = 0 // client does not want to receive heartbeats
                                  // from the server

### Minified version

In addition to the regular `stomp.js` file, the library is also available in a minified version `stomp.min.js`

### Annotated source

The source is now [documented](http://jmesnil.net/stomp-websocket/stomp.html) :)
