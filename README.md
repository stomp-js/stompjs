# STOMP.js

[![Build Status](https://travis-ci.org/stomp-js/stompjs.svg?branch=master)](https://travis-ci.org/stomp-js/stompjs)

This library provides a STOMP over WebSocket client for Web browser or node.js.
applications.

# Introduction

This repository is for version 5 and above of this library.
For version 3/4 of this library is maintained at https://github.com/stomp-js/stomp-websocket.

This library allows you to connect to a STOMP broker over WebSocket. This library
supports full STOMP specifications and all current protocol variants. Most
popular messaging brokers support STOMP and STOMP over WebSockets either natively
or using plugins.

In general JavaScript engines in browsers are not friendly to binary protocols,
so using STOMP is a good option because it is a text oriented protocol.

This library has its roots in a version released by [Jeff Mesnil](http://jmesnil.net/).

## Current Status

Version 5 of this library has been bottom up rewritten using TypeScript (versions 3/4
use CoffeeScript). The code has substantially changed, so, while there is a compatibility
mode, you might need to update your code.

This library is feature complete and has been used in production for many years. It
is actively maintained. You are welcome to file issues and submit pull requests.

## Upgrading

if you were using an older version of this library, you would need to make changes
to your code. Head to
[Upgrading](https://stomp-js.github.io/guide/stompjs/2018/09/08/upgrading-stompjs.html)

## Getting started

The API documentation is hosted as GitHub pages for entire StompJS family of libraries.
You may head straight to the https://stomp-js.github.io/api-docs/latest/

This library comes with detailed usage instructions. Please find it at 
[Usage instructions](https://stomp-js.github.io/guide/stompjs/2018/06/28/using-stompjs-v5.html).
Check out other guides at https://stomp-js.github.io/.

There are quite detailed API documentation,
you should start at https://stomp-js.github.io/api-docs/latest/classes/Client.html.

## Usage with RxJS

https://github.com/stomp-js/rx-stomp is based on this library and exposes the entire functionality
offered by this library as rxjs Observables.

## Usage with Angular2/4/5/6/7

https://github.com/stomp-js/ng2-stompjs is based on https://github.com/stomp-js/rx-stomp 
and exposes key classes as Angular Injectable Services.

## TypeScript definitions

The npm package includes TypeScript definitions, so there is no need no install it separately.

## Change log

Please visit [Change Log](Change-log.md).

## Contributing

If you want to understand the code, develop, or contribute. Please visit
[How to contribute](Contribute.md). 

## Authors

 * [Jeff Mesnil](http://jmesnil.net/)
 * [Jeff Lindsay](http://github.com/progrium)
 * [Vanessa Williams](http://github.com/fridgebuzz)
 * [Deepak Kumar](https://github.com/kum-deepak)
 * Astha Deep
 * [Dillon Sellars](https://github.com/dillon-sellars)
 * [Jimi Charalampidis](https://github.com/jimic)
 * [Raul](https://github.com/rulonder)
 * [Dimitar Georgiev](https://github.com/iMitaka)

## License

[License](LICENSE.md) - MIT License
