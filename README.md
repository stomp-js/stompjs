# STOMP.js

[![Build Status - Firefox, Chrome](https://github.com/stomp-js/stompjs/actions/workflows/linux.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/linux.yml)
[![Build Status - Safari, Edge](https://github.com/stomp-js/stompjs/actions/workflows/osx.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/osx.yml)
[![Node.js Tests](https://github.com/stomp-js/stompjs/actions/workflows/node-js.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/node-js.yml)
[![API Docs Refresh](https://github.com/stomp-js/stompjs/actions/workflows/docs-refresh.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/docs-refresh.yml)

**STOMP.js** is a fully-fledged STOMP over WebSocket library for **browsers** and **Node.js**, providing seamless integration with STOMP protocol-compliant messaging brokers.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Browser](#browser)
  - [Node.js](#nodejs)
- [Documentation](#documentation)
- [Upgrading](#upgrading)
- [Usage with RxJS](#usage-with-rxjs)
- [TypeScript Support](#typescript-support)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## Introduction

This library enables clients to connect to configured STOMP-over-WebSocket broker endpoints. It supports the STOMP protocol specifications v1.0, v1.1, and v1.2; a broker supporting STOMP over TCP alone is not sufficient for a direct WebSocket connection.

Popular brokers like RabbitMQ and ActiveMQ can provide STOMP-over-WebSocket endpoints with the appropriate configuration. For RabbitMQ, enable the `rabbitmq_web_stomp` plugin. Node.js clients can use STOMP over TCP through the separate [tcp-wrapper](https://github.com/stomp-js/tcp-wrapper) adapter.

## Features

- Simple and intuitive API for interacting with the STOMP protocol
- Support for STOMP protocol versions: **1.2**, **1.1**, and **1.0**
- Optional SockJS integration through `webSocketFactory` (requires a separate SockJS client and a compatible server endpoint; fallback is not supplied automatically)
- Supports both **browser** and **Node.js** environments
- STOMP over TCP in Node.js through [tcp-wrapper](https://github.com/stomp-js/tcp-wrapper) (separate adapter)
- Automatic reconnection with configurable delays
- Configurable incoming and outgoing STOMP heartbeats
- Full support for **binary payloads**
- RxJS integration through [rx-stomp](https://github.com/stomp-js/rx-stomp) for reactive programming

## Getting Started

This section provides a quick guide to integrating STOMP.js into your **browser** or **Node.js** application.

Both examples assume a local RabbitMQ broker with the `rabbitmq_web_stomp` plugin enabled and a WebSocket endpoint at `ws://localhost:15674/ws` (see [the RabbitMQ Dockerfile](rabbitmq/Dockerfile)). The `/topic/test01` destination follows RabbitMQ's STOMP conventions; adapt the endpoint, destinations, and `connectHeaders` for your broker. The `guest`/`guest` credentials are for local development only, and RabbitMQ restricts guest access to loopback by default. Use a configured account with appropriate permissions in production. For HTTPS pages, use a TLS-enabled `wss://` endpoint instead of `ws://`.

### Browser

To use STOMP.js in a browser:

1. Add the following in your HTML file:

   ```html
   <script type="importmap">
     {
       "imports": {
         "@stomp/stompjs": "https://ga.jspm.io/npm:@stomp/stompjs@7.3.0/esm6/index.js"
       }
     }
   </script>
   ```

   Modern browsers support import maps natively; no shim is needed. For older browsers without import-map support, use a compatible version of [es-module-shims](https://github.com/guybedford/es-module-shims) following its setup instructions.

2. Add this module script after the import map:

   ```html
   <script type="module">
     import { Client } from '@stomp/stompjs';

     const client = new Client({
       brokerURL: 'ws://localhost:15674/ws',
       connectHeaders: { login: 'guest', passcode: 'guest' },
       onConnect: () => {
         client.subscribe('/topic/test01', message =>
           console.log(`Received: ${message.body}`),
         );
         client.publish({
           destination: '/topic/test01',
           body: 'First Message',
         });
       },
       onStompError: frame => {
         console.error('Broker error:', frame.headers['message'], frame.body);
       },
       onWebSocketError: event => {
         console.error('WebSocket error:', event);
       },
     });

     client.activate();

     // When finished, call this from your application's cleanup logic:
     // await client.deactivate();
   </script>
   ```

### Node.js

To use STOMP.js in a Node.js environment:

1. Install the package:

   ```bash
   npm install @stomp/stompjs ws
   ```

2. Save this as `example.mjs` and run `node example.mjs` (or use a `.js` file in a package with `"type": "module"`):

   ```javascript
   import { Client } from '@stomp/stompjs';

   import { WebSocket } from 'ws';
   globalThis.WebSocket = WebSocket;

   const client = new Client({
     brokerURL: 'ws://localhost:15674/ws',
     connectHeaders: { login: 'guest', passcode: 'guest' },
     onConnect: () => {
       client.subscribe('/topic/test01', message =>
         console.log(`Received: ${message.body}`),
       );
       client.publish({ destination: '/topic/test01', body: 'First Message' });
     },
     onStompError: frame => {
       console.error('Broker error:', frame.headers['message'], frame.body);
     },
     onWebSocketError: event => {
       console.error('WebSocket error:', event);
     },
   });

   client.activate();

   // When finished, call this from your application's cleanup logic:
   // await client.deactivate();
   ```

Keep subscriptions inside `onConnect` so they are recreated after automatic reconnection. When your application no longer needs the connection, run `await client.deactivate()` in the same scope as `client` to disconnect and stop reconnection attempts.

---

## Documentation

Comprehensive documentation can be found at: [STOMP.js Documentation](https://stomp-js.github.io/)

- **API Overview**: [API Docs (latest)](https://stomp-js.github.io/api-docs/latest/)
- **Usage Guide**: [Guide to Using STOMP.js](https://stomp-js.github.io/guide/stompjs/using-stompjs-v5.html)
- **Feature Guides**: Explore additional guides at [https://stomp-js.github.io/](https://stomp-js.github.io/)

## Upgrading

If you are updating from an older version of STOMP.js, review the [Upgrading Guide](https://stomp-js.github.io/#upgrading) for any required changes.

## Usage with RxJS

[Rx-Stomp](https://github.com/stomp-js/rx-stomp) builds upon this library, exposing all its features as **RxJS Observables**, enabling reactive programming patterns.

## TypeScript Support

STOMP.js includes built-in TypeScript definitions, eliminating the need for external type definition files. Begin coding with TypeScript out-of-the-box!

## Changelog

Visit the [Change Log](Change-log.md) for information about changes, improvements, and fixes in recent releases.

## Contributing

Thinking of contributing to STOMP.js? Great! To get started:

- Read the [Contributing Guide](Contribute.md) for development instructions.
- Report bugs or suggest features by creating an issue on GitHub.

We welcome contributions from the community!

## Authors

This library is made possible by these amazing contributors:

- [Deepak Kumar](https://github.com/kum-deepak)
- [Astha Deep](https://github.com/astha183)
- [Dillon Sellars](https://github.com/dillon-sellars)
- [Jimi Charalampidis](https://github.com/jimic)
- [Raul](https://github.com/rulonder)
- [Dimitar Georgiev](https://github.com/iMitaka)
- [Genadi](https://github.com/genadis)
- [Bobohuochai](https://github.com/bobohuochai)
- [Sailai](https://github.com/sailai)
- [Harsh Deep](https://github.com/harsh183)
- [Nikos Epping](https://github.com/Nikos410)
- [Tom Pachtner](https://github.com/tomamatics)
- [David Nussio](https://github.com/davidnussio)
- [Camille Drapier](https://github.com/CamilleDrapier)
- [chai min](https://github.com/minchai23)
- [umsungjun](https://github.com/umsungjun)
- [tomek3e](https://github.com/tomek3e)
- [Samuel Yinger](https://github.com/GoldenSunX)
- [RokkieBrown](https://github.com/rokkie)
- [Alexey](https://github.com/Al-ex-ei)

This library is originally based on [stompjs](https://github.com/jmesnil/stomp-websocket) by [Jeff Mesnil](http://jmesnil.net/) with enhancements and bug fixes from [Jeff Lindsay](http://github.com/progrium) and [Vanessa Williams](http://github.com/fridgebuzz).

## License

Licensed under the **Apache-2.0 License**. See the [LICENSE file](LICENSE) for details.
