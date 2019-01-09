#!/usr/bin/env node

'use strict'

const ethNodeSyncingServer = require('../lib/eth-node-syncing-server')

const ArgumentParser = require('argparse').ArgumentParser;
const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Run an HTTP server for Geth node "synced or syncing" checks.  Responds 200 if synced or syncing, 500 if frozen or otherwise unsynced.'
});

parser.addArgument(
  [ '-na', '--node-address' ],
  {
    defaultValue: 'localhost',
    help: 'Address of the Geth node',
    dest: 'nodeAddress'
  }
)

parser.addArgument(
  [ '-np', '--node-port' ],
  {
    defaultValue: 8545,
    help: 'RPC port of the Geth node',
    dest: 'nodePort'
  }
)

parser.addArgument(
  [ '-p', '--port' ],
  {
    defaultValue: process.env.PORT || 50336,
    help: 'Port the HTTP server will listen on.  Overrides $PORT.',
    dest: 'port'
  }
)

parser.addArgument(
  [ '-n', '--network' ],
  {
    defaultValue: process.env.NETWORK || 'main',
    help: 'Ethereum network of interest (needed for checking block counts on etherscan).  Overrides $NETWORK.',
    dest: 'network'
  }
)

parser.addArgument(
  [ '-k', '--key' ],
  {
    defaultValue: process.env.ETHERSCAN_API_KEY,
    help: 'Etherscan API key (needed for checking block counts).  Overrides $ETHERSCAN_API_KEY.',
    dest: 'etherscanApiKey'
  }
)

parser.addArgument(
  [ '-b', '--max-block-difference' ],
  {
    help: 'Maximum difference between local block and etherscan block for the node to be considered "synced"',
    dest: 'maxBlockDifference'
  }
)

parser.addArgument(
  [ '-t', '--max-time-frozen' ],
  {
    help: 'Maximum seconds the node can remain in a "syncing" state with no progress before the server reports an unhealthy state',
    dest: 'maxSyncFreeze'
  }
)

parser.addArgument(
  [ '-c', '--cache-seconds' ],
  {
    help: 'Seconds to cache network block time responses, to reduce the number of etherscan API calls made.  Caching will result in inaccurate output.',
    dest: 'cacheSeconds'
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

if (!args.etherscanApiKey) {
  throw new Error('Etherscan API key not specified with `-k / --key` or $ETHERSCAN_API_KEY')
}

ethNodeSyncingServer({
  nodeAddress: args.nodeAddress,
  nodePort: args.nodePort,
  port: args.port,
  network: args.network,
  etherscanApiKey: args.etherscanApiKey,
  maxBlockDifference: args.maxBlockDifference,
  maxSyncFreeze: args.maxSyncFreeze,
  cacheSeconds: args.cacheSeconds,
  verbose:args.verbose
})

console.log(`listening on ${args.port} to report "synced or syncing" status of ${args.network} network node at http://${args.nodeAddress}:${args.nodePort}`)
