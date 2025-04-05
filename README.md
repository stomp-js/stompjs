# STOMP.js

[![Firefox, Chrome](https://github.com/stomp-js/stompjs/actions/workflows/linux.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/linux.yml)
[![Safari, Edge](https://github.com/stomp-js/stompjs/actions/workflows/osx.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/osx.yml)
[![NodeJS Test](https://github.com/stomp-js/stompjs/actions/workflows/node-js.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/node-js.yml)
[![API docs refresh](https://github.com/stomp-js/stompjs/actions/workflows/docs-refresh.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/docs-refresh.yml)

This library provides a STOMP over WebSocket client for Web browser and node.js applications.

Please visit https://stomp-js.github.io/ for guides, FAQs and API docs.

# Introduction

This library allows you to connect to a STOMP broker over WebSocket. This library
supports complete STOMP specifications including all current protocol variants. Most
popular messaging brokers support STOMP and STOMP over WebSockets out-of-the-box
or using plugins.

## Features

- Simple API to interact with the Stomp protocol
- Support for v1.2, v1.1 and v1.0 of the Stomp protocol
- Support for fallback options in case of WebSocket unavailable
- Browser and Node.js support
- Option to use STOMP over TCP
- Binary payload support

## Usage

### Browser

```html
<!--
    JSPM Generator Import Map
    Edit URL: https://generator.jspm.io/#U2NgYGBkDM0rySzJSU1hcCguyc8t0AeTWcUO5noGega6SakliaYAYTzJAykA
  -->
<script type="importmap">
  {
    "imports": {
      "@stomp/stompjs": "https://ga.jspm.io/npm:@stomp/stompjs@7.0.0/esm6/index.js"
    }
  }
</script>

<!-- ES Module Shims: Import maps polyfill for modules browsers without import maps support (all except Chrome 89+) -->
<script
  async
  src="https://ga.jspm.io/npm:es-module-shims@1.5.1/dist/es-module-shims.js"
  crossorigin="anonymous"
></script>

<script type="module">
  import { Client } from '@stomp/stompjs';

  const client = new Client({
    brokerURL: 'ws://localhost:15674/ws',
    onConnect: () => {
      client.subscribe('/topic/test01', message =>
        console.log(`Received: ${message.body}`)
      );
      client.publish({ destination: '/topic/test01', body: 'First Message' });
    },
  });

  client.activate();
</script>
```

### NodeJS

```bash
$ npm install @stomp/stompjs ws
```

```javascript
import { Client } from '@stomp/stompjs';

import { WebSocket } from 'ws';
Object.assign(global, { WebSocket });

const client = new Client({
  brokerURL: 'ws://localhost:15674/ws',
  onConnect: () => {
    client.subscribe('/topic/test01', message =>
      console.log(`Received: ${message.body}`)
    );
    client.publish({ destination: '/topic/test01', body: 'First Message' });
  },
});

client.activate();
```

## Further information

The API documentation is hosted as GitHub pages for the StompJS family of libraries.
You may head straight to the https://stomp-js.github.io/api-docs/latest/

This library comes with detailed usage instructions. Please find it at
[Usage instructions](https://stomp-js.github.io/guide/stompjs/using-stompjs-v5.html).
Check out other guides at https://stomp-js.github.io/.

There is quite detailed API documentation,
you should start at https://stomp-js.github.io/api-docs/latest/classes/Client.html.

## Upgrading

if you were using an older version of this library, you would need to make changes
to your code. Head to
[Upgrading](https://stomp-js.github.io/#upgrading).

## Usage with RxJS

https://github.com/stomp-js/rx-stomp is based on this library and exposes the entire functionality
offered by this library as RxJS Observables.

## TypeScript definitions

The npm package includes TypeScript definitions, so there is no need to install it separately.

## Change-log

Please visit [Change Log](Change-log.md).

## Contributing

If you want to understand the code, develop, or contribute. Please visit
[How to contribute](Contribute.md).

## Authors

- [Jeff Mesnil](http://jmesnil.net/)
- [Jeff Lindsay](http://github.com/progrium)
- [Vanessa Williams](http://github.com/fridgebuzz)
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

## License

[License](LICENSE) - Apache-2.0
