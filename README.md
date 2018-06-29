# STOMP.js

[![Build Status](https://travis-ci.org/stomp-js/stomp-websocket.svg?branch=master)](https://travis-ci.org/stomp-js/stomp-websocket)

This library provides a WebSocket over STOMP client for Web browser or node.js 
applications.

# Introduction

This library allows you to connect to a STOMP broker over WebSocket. This library
supports full STOMP specifications and all current protocol variants. Most
popular messaging brokers support STOMP and STOMP over WebSockets either natively
or using plugins.

In general JavaScript engines in browsers are not friendly to binary protocols,
so using STOMP is a better option because it is a text oriented protocol.

This library was originally developed by [Jeff Mesnil](http://jmesnil.net/).

## Current Status

This library is feature complete and has been used in production for many years. It
is actively maintained. You are welcome to file issues and submit pull requests.

## Getting started

The documentation is hosted as GitHub pages.
You may head straight to the 
[entry point](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Introduction.md.html).
(or [with frames](https://stomp-js.github.io/stomp-websocket/codo/))

This library comes with detailed usage instructions. Please find it at 
[Usage instructions](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Usage.md.html). 

If you were using older versions and wish to benefit from newer features, head to
[Upgrading](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Upgrade.md.html). 

If you are an existing user and will like to deep dive - API references for important entities:

* [Stomp](https://stomp-js.github.io/stomp-websocket/codo/mixin/Stomp.html)
* [Client](https://stomp-js.github.io/stomp-websocket/codo/class/Client.html)

## NodeJS

If you are using this library in NodeJS you might need to make changes, please check
[Upgrading](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Upgrade.md.html). 

## Usage with Angular2/4/5

https://github.com/stomp-js/ng2-stompjs is based on this library and exposes the entire functionality
offered by this library as Angular Services and rxjs Observables. Both these libraries are maintained
by a similar set of contributors.

## TypeScript definitions

The npm package includes [TypeScript definitions](https://github.com/stomp-js/stomp-websocket/blob/master/index.d.ts), so there is no need no install it separately.

## Change log

Please visit [Change Log](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Change-log.md.html).

## Contributing

If you want to understand the code, develop, or contribute. Please visit
[How to contribute](https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Contribute.md.html). 

## Authors

 * [Jeff Mesnil](http://jmesnil.net/)
 * [Jeff Lindsay](http://github.com/progrium)
 * [Vanessa Williams](http://github.com/fridgebuzz)
 * [Deepak Kumar](https://github.com/kum-deepak)
 * Astha Deep
 * [Dillon Sellars](https://github.com/dillon-sellars)
 * [Jimi Charalampidis](https://github.com/jimic)
 * [Raul](https://github.com/rulonder)

## License

[License](https://stomp-js.github.io/stomp-websocket/codo/extra/LICENSE.txt.html) - Apache v2 License
