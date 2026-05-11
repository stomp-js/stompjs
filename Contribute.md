# Contributing

## How to contribute

- File issues.
- Edit/write documentation.
- Submit pull requests.
- Test in different environments.
- Raise awareness.

## Summary of tools

Following tools are getting used:

- `TypeScript` as primary language - https://www.typescriptlang.org/
- `Playwright` for test cases - https://playwright.dev/
- `c8` for code coverage - https://github.com/bcoe/c8
- `Rollup` for build - https://rollupjs.org/
- `ESLint` for linting - https://eslint.org/
- `Prettier` for code formatting - https://prettier.io/
- `nodejs` during development - https://nodejs.org/
- `npm` for dependency management, packaging and distribution - https://www.npmjs.com/
- `git` for version control - https://git-scm.com/

## Initial setup

Instructions on setting up development environment:

- Install `node` and `npm` - https://nodejs.org/
- Checkout code from GitHub - you may fork the code first into your GitHub account.
- Use `npm i` to install dependencies:
  ```bash
  $ npm i
  ```
- Install the Playwright browsers (only needed if you plan to run tests in a browser project):
  ```bash
  $ npx playwright install
  ```

## Project structure

Important files and folders:

```text
<Project Folder>
├── LICENSE
├── README.md
├── bin/                     -- Scripts invoked from `npm` tasks
├── bundles/                 -- Generated UMD bundle (build output)
├── esm6/                    -- Generated ES modules (build output)
├── eslint.config.mjs
├── package-lock.json
├── package.json
├── playwright.config.ts     -- Playwright projects: node, chromium, firefox, webkit
├── rabbitmq/
│   └── Dockerfile           -- This builds a docker image that is used to run test cases
├── rollup.config.mjs
├── spec/                    -- Test cases run via Playwright (Node and browser projects)
│   ├── helpers/
│   └── unit/                -- Unit tests
│       └── compatibility/   -- Tests for the compatibility (Stomp v5) API
├── src/                     -- Typescript sources
│   └── compatibility/       -- Code for compatibility mode
└── tsconfig.json
```

## Setup a Stomp broker

- A Stomp broker is used for running the tests. I have been using RabbitMQ.
- The broker URL and credentials are defined in `spec/helpers/connect-helpers.ts`.
  Defaults assume RabbitMQ on `localhost:15674`.
- Please note that in RabbitMQ you will need to enable Stomp and WebStomp plugins.
- By default RabbitMQ WebStomp will treat messages as text, you will need to tell
  it to use binary frames:
  ```bash
  $ echo 'web_stomp.ws_frame = binary' >> /etc/rabbitmq/rabbitmq.conf
  ```
- A RabbitMQ Dockerfile is provided with necessary plugins and configuration. To use it, run:
  ```bash
  $ docker build -t myrabbitmq rabbitmq/ # Needed only once
  $ docker run -d -p 15674:15674 myrabbitmq # to start the broker
  ```

## Building and testing

Key npm tasks:

- `clean` - Remove generated build artifacts
- `build` - Build two variants - ES Modules and UMD
- `rollup` - Internally used by `npm run build`
- `test` - Run tests in Node via Playwright (`--project=node`)
- `test:coverage` - Run tests under `c8` and produce coverage reports (text, html, lcov)
- `lint` - Run ESLint
- `prettier` - Format source files with Prettier

### Basic development workflow

1. Checkout a new branch.
1. Make code changes (src/specs)
1. Build:
   ```bash
   $ npm run build
   ```
1. Run tests:
   - Default (Node):
     ```bash
     $ npm run test
     ```
   - With coverage:
     ```bash
     $ npm run test:coverage
     ```
   - In a specific browser via Playwright:
     ```bash
     $ npx playwright test --project=chromium   # or firefox, webkit
     ```
   - _**Caution:** All projects share the same broker and queue names, so running
     several projects against the same broker concurrently may cause unexpected failures._
1. Lint and format before committing:
   ```bash
   $ npm run lint
   $ npm run prettier
   ```
1. Update documentation - do update Change-log.md
1. Please follow GitHub guidelines. Raise an issue if you are unclear.
