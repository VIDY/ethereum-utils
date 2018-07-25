'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const ethNodeSyncingServer = require('./eth-node-syncing-server')

const rp = require('request-promise')

describe('eth-node-syncing-server.js', () => {
  const sandbox = sinon.createSandbox()
  const clock = sinon.useFakeTimers()

  const port = 51234
  const network = 'testNetwork'
  const etherscanApiKey = 'testApiKey'
  const nodeAddress = 'testNodeAddress'
  const nodePort = 'testNodePort'
  const maxBlockDifference = 'testMaxBlockDifference'
  const maxSyncFreeze = 500

  var server

  beforeEach(() => {
    server = ethNodeSyncingServer({
      port,
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference,
      maxSyncFreeze
    })

    sandbox.stub(ethNodeSyncingServer, 'ethNodeSynced')
    sandbox.stub(ethNodeSyncingServer, 'getLocalSyncingResponse')
    sandbox.stub(ethNodeSyncingServer, 'syncProgressMade')
  })

  afterEach(() => {
    server.close()
    sandbox.reset()
    sandbox.restore()
    clock.tick(1000 * 1000)
  })

  after(() => {
    clock.restore()
  })

  it('if syncing, should report 200 with syncing response', async () => {
    ethNodeSyncingServer.ethNodeSynced.callsFake(() => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(() => Promise.resolve('syncing response'))
    ethNodeSyncingServer.syncProgressMade.callsFake(() => true)

    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.body, 'syncing response')
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[0][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[0][0], {
      result: 'syncing response',
      lastUniqueResult: undefined
    })
    assert.deepEqual(ethNodeSyncingServer.ethNodeSynced.args.length, 0)
  })

  it('if syncing and frozen, but for less than the max sync freeze time, should report 200 with syncing response', async () => {
    ethNodeSyncingServer.ethNodeSynced.callsFake(() => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(() => Promise.resolve('syncing response'))
    ethNodeSyncingServer.syncProgressMade.callsFake(({result, lastUniqueResult}) => !lastUniqueResult)

    // first call
    await rp(`http://localhost:${port}`)
    // wait less than max sync
    clock.tick((maxSyncFreeze - 1) * 1000)
    // second call
    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.body, 'syncing response')
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[0][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[1][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[0][0], {
      result: 'syncing response',
      lastUniqueResult: undefined
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[1][0], {
      result: 'syncing response',
      lastUniqueResult: 'syncing response'
    })
    assert.deepEqual(ethNodeSyncingServer.ethNodeSynced.args.length, 0)
  })

  it('if syncing and frozen, but for more than the max sync freeze time, should report 500 with syncing response', async () => {
    ethNodeSyncingServer.ethNodeSynced.callsFake(() => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(() => Promise.resolve('syncing response'))
    ethNodeSyncingServer.syncProgressMade.callsFake(({result, lastUniqueResult}) => !lastUniqueResult)

    // first call
    await rp(`http://localhost:${port}`)
    // wait less than max sync
    clock.tick((maxSyncFreeze + 1) * 1000)
    // second call
    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 500)
    assert.strictEqual(response.body, 'syncing response')
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[0][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[1][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[0][0], {
      result: 'syncing response',
      lastUniqueResult: undefined
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[1][0], {
      result: 'syncing response',
      lastUniqueResult: 'syncing response'
    })
    assert.deepEqual(ethNodeSyncingServer.ethNodeSynced.args.length, 0)
  })

  it('if syncing and frozen, should report 200 until max sync freeze expires', async () => {
    ethNodeSyncingServer.ethNodeSynced.callsFake(() => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(() => Promise.resolve('syncing response'))
    ethNodeSyncingServer.syncProgressMade.callsFake(({result, lastUniqueResult}) => !lastUniqueResult)

    // first call; prime things
    await rp(`http://localhost:${port}`)
    for (var i = 10; i < maxSyncFreeze * 2; i += 10) {
      clock.tick(1000 * 10)
      const response = await rp({
        uri: `http://localhost:${port}`,
        resolveWithFullResponse: true,
        simple: false
      })

      assert.strictEqual(response.statusCode, i > maxSyncFreeze ? 500 : 200)
    }
  })

  it('if syncing and frozen, then resumes, should report 200 -> 500 -> 200 -> 500', async () => {
    const startTime = (new Date()).getTime() / 1000
    ethNodeSyncingServer.ethNodeSynced.callsFake(async () => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(async () => {
      return Promise.resolve(((new Date()).getTime() / 1000 - startTime) < maxSyncFreeze * 2 ? 'syncingResponse1' : 'syncingResponse2')
    })
    ethNodeSyncingServer.syncProgressMade.callsFake(({result, lastUniqueResult}) => (!lastUniqueResult || result !== lastUniqueResult))

    // first call; prime things
    await rp(`http://localhost:${port}`)
    for (var i = 10; i < maxSyncFreeze * 4; i += 10) {
      clock.tick(1000 * 10)
      const response = await rp({
        uri: `http://localhost:${port}`,
        resolveWithFullResponse: true,
        simple: false
      })

      var progress = (i <= maxSyncFreeze || (i >= maxSyncFreeze * 2 && i <= maxSyncFreeze * 3))
      assert.strictEqual(response.statusCode, progress ? 200 : 500)
    }
  })

  it('if syncing and frozen, then resumes, should report 200 -> 500 -> 200 -> 500 defaulting to 150 maxSyncTime', async () => {
    server.close()
    server = ethNodeSyncingServer({
      port,
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference
    })

    const startTime = (new Date()).getTime() / 1000
    ethNodeSyncingServer.ethNodeSynced.callsFake(async () => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(async () => {
      const time = (new Date()).getTime() / 1000
      return Promise.resolve((time - startTime) < 150 * 2 ? 'syncingResponse1' : 'syncingResponse2')
    })
    ethNodeSyncingServer.syncProgressMade.callsFake(({result, lastUniqueResult}) => (!lastUniqueResult || result !== lastUniqueResult))

    // first call; prime things
    await rp(`http://localhost:${port}`)

    // loop
    for (var i = 10; i < 150 * 4; i += 10) {
      clock.tick(1000 * 10)
      const response = await rp({
        uri: `http://localhost:${port}`,
        resolveWithFullResponse: true,
        simple: false
      })

      var progress = (i <= 150 || (i >= 150 * 2 && i <= 150 * 3))
      assert.strictEqual(response.statusCode, progress ? 200 : 500)
    }
  })

  it('if not syncing but synced, should report 200 with block number difference', async () => {
    ethNodeSyncingServer.ethNodeSynced.callsFake(() => Promise.resolve({synced: true, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(() => Promise.resolve(false))
    ethNodeSyncingServer.syncProgressMade.callsFake(() => false)

    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.body, '-450')
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[0][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[0][0], {
      result: false,
      lastUniqueResult: undefined
    })
    assert.deepEqual(ethNodeSyncingServer.ethNodeSynced.args[0][0], {
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference,
      full: true
    })
  })

  it('if not syncing or synced, should report 500 with block number difference', async () => {
    ethNodeSyncingServer.ethNodeSynced.callsFake(() => Promise.resolve({synced: false, localBlockNum: 550, networkBlockNum: 1000}))
    ethNodeSyncingServer.getLocalSyncingResponse.callsFake(() => Promise.resolve(false))
    ethNodeSyncingServer.syncProgressMade.callsFake(() => false)

    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, 500)
    assert.strictEqual(response.body, '-450')
    assert.deepEqual(ethNodeSyncingServer.getLocalSyncingResponse.args[0][0], {
      address: nodeAddress,
      port: nodePort
    })
    assert.deepEqual(ethNodeSyncingServer.syncProgressMade.args[0][0], {
      result: false,
      lastUniqueResult: undefined
    })
    assert.deepEqual(ethNodeSyncingServer.ethNodeSynced.args[0][0], {
      network,
      etherscanApiKey,
      nodeAddress,
      nodePort,
      maxBlockDifference,
      full: true
    })
  })

})
