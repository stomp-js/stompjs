# STOMP.js

[![Firefox, Chrome](https://github.com/stomp-js/stompjs/actions/workflows/linux.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/linux.yml)
[![Safari, Edge](https://github.com/stomp-js/stompjs/actions/workflows/osx.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/osx.yml)
[![NodeJS Test](https://github.com/stomp-js/stompjs/actions/workflows/node-js.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/node-js.yml)
[![API docs refresh](https://github.com/stomp-js/stompjs/actions/workflows/docs-refresh.yml/badge.svg?branch=develop)](https://github.com/stomp-js/stompjs/actions/workflows/docs-refresh.yml)


[![Verified on Openbase](https://badges.openbase.com/js/verified/@stomp/stompjs.svg?token=zqjiUL4M7rA2VDndBXG2FMeS/9PVZzs9qfhw/JI3tJ4=)](https://openbase.com/js/@stomp/stompjs?utm_source=embedded&amp;utm_medium=badge&amp;utm_campaign=rate-badge)

This library provides a STOMP over WebSocket client for Web browser and node.js applications.

Please visit https://stomp-js.github.io/ for guides, FAQs and API docs.

# Introduction

This library allows you to connect to a STOMP broker over WebSocket. This library
supports complete STOMP specifications including all current protocol variants. Most
popular messaging brokers support STOMP and STOMP over WebSockets out-of-the-box
or using plugins.

In general, JavaScript engines in browsers are not friendly to binary protocols,
so using STOMP is a good option because it is a text-oriented protocol.

This library has its roots in a version released by [Jeff Mesnil](http://jmesnil.net/).

## Current Status

This library is feature complete and has been used in production for many years. It
is actively maintained. You are welcome to file issues and submit pull requests.

## Getting started

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

## License

[License](LICENSE) - Apache-2.0
