'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const ethNodeSyncedServer = require('./eth-node-synced-server')

const rp = require('request-promise')

describe('eth-node-synced-server', () => {
  const sandbox = sinon.createSandbox()

  const port = 51234
  const network = 'testNetwork'
  const etherscanApiKey = 'testApiKey'
  const nodeAddress = 'testNodeAddress'
  const nodePort = 'testNodePort'
  const maxBlockDifference = 'testMaxBlockDifference'

  var server

  before(() => {
    server = ethNodeSyncedServer({
      port,
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference
    })
  })

  after(() => {
    server.close()
  })

  beforeEach(() => {
    sandbox.stub(ethNodeSyncedServer, 'ethNodeSynced')
  })

  afterEach(() => {
    sandbox.reset()
    sandbox.restore()
  })

  it('should report 200 for a synced node, including block number difference', async () => {
    ethNodeSyncedServer.ethNodeSynced.callsFake(() => Promise.resolve({
      synced: true,
      localBlockNum: 550,
      networkBlockNum: 1000
    }))

    const response = await rp(`http://localhost:${port}`)

    assert.strictEqual(response, '-450')
    assert.deepEqual(ethNodeSyncedServer.ethNodeSynced.args[0][0], {
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference,
      cacheSeconds: undefined,
      full: true
    })
  })

  it('should report 500 for an unsynced node, including block number difference', async () => {
    ethNodeSyncedServer.ethNodeSynced.callsFake(() => Promise.resolve({
      synced: false,
      localBlockNum: 550,
      networkBlockNum: 1000
    }))

    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 500)
    assert.strictEqual(response.body, '-450')
    assert.deepEqual(ethNodeSyncedServer.ethNodeSynced.args[0][0], {
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference,
      cacheSeconds: undefined,
      full: true
    })
  })

  it('should report 500 when checking synced status fails', async () => {
    ethNodeSyncedServer.ethNodeSynced.callsFake(() => Promise.reject('test-generated error case'))

    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 500)
  })
})
