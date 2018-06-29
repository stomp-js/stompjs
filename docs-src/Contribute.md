# Contributing

## How to contribute

* File issues.
* Edit/write documentation.
* Submit pull requests.
* Test in different environments.
* Raise awareness.

## Summary of tools

Following tools are getting used:

* `CoffeeScript` as primary language - http://coffeescript.org/
* `codo` for API documentation - https://github.com/coffeedoc/codo
* `cake` for build automation - http://coffeescript.org/
* `qunit` for test cases - http://qunitjs.com/
* `nodejs` during development - https://nodejs.org/
* `yarn` for dependency management - https://yarnpkg.com/
* `npm` for packaging and distribution - https://www.npmjs.com/

## Initial setup

Instructions on setting up development environment:

* Install `node` and `npm` - https://nodejs.org/
* Install `yarn` - https://yarnpkg.com/en/docs/install
* Install 'codo', it needs to be installed globally - `npm install -g codo`
* Checkout code from GitHub - you may fork the code first into your GitHub account.
* Use `yarn` to install dependencies:
    ```bash
    $ yarn
    ```

## Project structure

<pre>
├── Cakefile                       - build/watch tasks & scripts
├── LICENSE.txt
├── README.md
├── RELEASE_NOTES.md
├── bower.json
├── coffeelint.json
├── doc/                           - Legacy documentation
├── docs/                          - Documentation (root of GitHub pages)
│   └── codo/                      - Generated documentation
├── docs-src/                      - Guides (kodo build process uses it)
├── example/                       - Legacy example 
├── index.d.ts                     - Typescript type definitions
├── index.js                       - Entry point for nodejs
├── lib/                           - Compiled JS files
│   ├── stomp.js                   - Main library code
│   └── stomp.min.js
├── package.json
├── src/                           - CoffeeSctipt files
│   └── stomp.coffee               - Main library code
├── tests/                         - All tests
│   ├── config/
│   │   ├── browser-config.js      - Browser specific configuration
│   │   └── node-config.js         - NodeJS specific configuration
│   ├── index.html                 - Entry point for browser tests
│   └── unit/                      - All test files
└── yarn.lock                      - Current package versions
</pre>

## Setup a Stomp broker

* A Stomp broker is used for running the tests. I have been using RabbitMQ.
* Edit `tests/config/browser-config.js` and `tests/config/node-config.js` as per
  your setup. Defaults should work for a RabbitMQ default setup on localhost.
* Please note that in RabbitMQ you will need to enable Stomp and WebStomp plugins.
* A RabbitMQ Dockerfile is provided with the necessary plugins. To use it, run:
    * `docker build -t myrabbitmq .`
    * `docker run -d -p 15674:15674 myrabbitmq`

## Building and testing

To build JavaScript from the CoffeeScript source code:

```bash
$ cake build
```

To run tests using nodejs:

```bash
$ cake test
```

To continuously run tests on file changes:

```bash
$ cake watch
```

## Browser Tests

* Browser and node environments use the same set of test cases.
* Open `test/index.html` in your browser.
* If Chrome fails with "Uncaught DOMException: Failed to read the 'sessionStorage' property from 'Window'
  you need to [Unblock third-party cookies](https://www.chromium.org/for-testers/bug-reporting-guidelines/uncaught-securityerror-failed-to-read-the-localstorage-property-from-window-access-is-denied-for-this-document) 
  or use Firefox.  

_**Caution:** As both browser and nodejs use same set of test cases and hence same queue
names. So, running both together may cause unexpected failures._

## Submit pull requests

* Run `cake build` to update generated files
* Please follow GitHub guidelines. Raise an issue if you are unclear.

## STOMP API

STOMP over WebSocket provides a straightforward mapping from a STOMP frame 
to a JavaScript object. If you need to understand Stomp protocol,
please see http://stomp.github.io/stomp-specification-1.2.html
                                                                  
<table>
<caption>Frame Object</caption>
<tr><th>Property<th>Type<th>Notes
<tr><th><code>command</code><td>String<td>name of the frame (<code>"CONNECT"</code>, <code>"SEND"</code>, etc.)
<tr><th><code>headers</code><td>JavaScript object<td>
<tr><th><code>body</code><td>String<td>
</table>


The `command` and `headers` properties will always be defined but the `headers` 
can be empty if the frame has no headers. The `body` can be `null` if the frame 
does not have a body.
