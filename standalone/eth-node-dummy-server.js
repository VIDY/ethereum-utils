#!/usr/bin/env node

'use strict'

const ethNodeDummyServer = require('../lib/eth-node-dummy-server')

const ArgumentParser = require('argparse').ArgumentParser;
const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Run an HTTP server for dummy health checks.'
});

parser.addArgument(
  [ '-p', '--port' ],
  {
    defaultValue: process.env.PORT || 50336,
    help: 'Port the HTTP server will listen on.  Overrides $PORT.',
    dest: 'port'
  }
)

parser.addArgument(
  [ '-s', '--status' ],
  {
    defaultValue: 200,
    help: 'Response status code.',
    dest: 'status'
  }
)

parser.addArgument(
  [ '-d', '--data' ],
  {
    defaultValue: 'Dummy response',
    help: 'Text response data to supply to requesters.',
    dest: 'data'
  }
)

parser.addArgument(
  [ '-V', '--verbose' ],
  {
    defaultValue: false,
    help: 'Provide console output for every incoming request',
    dest: 'verbose',
    action: 'storeTrue'
  }
)

const args = parser.parseArgs();

ethNodeDummyServer({
  port: args.port,
  status: args.status,
  data: args.data,
  verbose: args.verbose
})

console.log(`listening on ${args.port} to report dummy status ${args.status} with body '${args.data}'`)
