'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const ethNodeSyncing = require('./eth-node-syncing')

describe('eth-node-syncing.js', () => {
  const sandbox = sinon.createSandbox()

  describe('ethNodeSyncing', () => {
    beforeEach(() => {
      sandbox.stub(ethNodeSyncing, 'getLocalSyncingResponse')
    })

    afterEach(() => {
      sandbox.reset()
      sandbox.restore()
    })

    it('should report "true" for any non-false sync response', async () => {
      ethNodeSyncing.getLocalSyncingResponse.callsFake(async ({address, port}) => {
        if (port == 0) {
          return Promise.resolve("success")
        } else if (port == 1) {
          return Promise.resolve({currentBlock: 700, pulledStates: 230})
        } else if (port == 2) {
          return Promise.resolve(true)
        } else {
          return Promise.reject('Unrecognized test port')
        }
      })

      assert.strictEqual(await ethNodeSyncing({nodeAddress: 'testAddress', nodePort: 0}), true)
      assert.strictEqual(await ethNodeSyncing({nodeAddress: 'testAddress', nodePort: 1}), true)
      assert.strictEqual(await ethNodeSyncing({nodeAddress: 'testAddress', nodePort: 2}), true)

      assert.deepEqual(ethNodeSyncing.getLocalSyncingResponse.args[0][0], {address: 'testAddress', port: 0})
      assert.deepEqual(ethNodeSyncing.getLocalSyncingResponse.args[1][0], {address: 'testAddress', port: 1})
      assert.deepEqual(ethNodeSyncing.getLocalSyncingResponse.args[2][0], {address: 'testAddress', port: 2})
    })

    it('should report "false" for any non-true sync response', async () => {
      ethNodeSyncing.getLocalSyncingResponse.callsFake(async ({address, port}) => {
        if (port == 0) {
          return Promise.resolve(undefined)
        } else if (port == 1) {
          return Promise.resolve(false)
        } else {
          return Promise.reject('Unrecognized test port')
        }
      })

      assert.strictEqual(await ethNodeSyncing({nodeAddress: 'testAddress', nodePort: 0}), false)
      assert.strictEqual(await ethNodeSyncing({nodeAddress: 'testAddress', nodePort: 1}), false)

      assert.deepEqual(ethNodeSyncing.getLocalSyncingResponse.args[0][0], {address: 'testAddress', port: 0})
      assert.deepEqual(ethNodeSyncing.getLocalSyncingResponse.args[1][0], {address: 'testAddress', port: 1})
    })
  })

  describe('ethNodeSyncing.getLocalSyncingResponse', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('should return the result of an eth_syncing call', async () => {
      const result = { text: 'arbitraryText' }
      const address = 'www.pretendnode.com'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_syncing',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result
        })

      assert.deepEqual(await ethNodeSyncing.getLocalSyncingResponse({address, port}), result)
    })

    it('should return the result of an eth_syncing call with "localhost" the default address', async () => {
      const result = { text: 'arbitraryText' }
      const address = 'localhost'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_syncing',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result
        })

      assert.deepEqual(await ethNodeSyncing.getLocalSyncingResponse({port}), result)
    })

    it('should return the result of an eth_syncing call with "8545" the default port', async () => {
      const result = { text: 'arbitraryText' }
      const address = 'www.pretendnode.com'
      const port = 8545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_syncing',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result
        })

      assert.deepEqual(await ethNodeSyncing.getLocalSyncingResponse({address}), result)
    })

    it('should return the result of an eth_syncing call as boolean value "false" if not syncing', async () => {
      const result = { text: 'arbitraryText' }
      const address = 'www.pretendnode.com'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_syncing',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result: "false"
        })

      assert.deepEqual(await ethNodeSyncing.getLocalSyncingResponse({address, port}), false)
    })

    it('should reject if eth_syncing call is unsuccessful', async () => {
      const address = 'www.pretendnode.com'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_syncing',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(500)

      assertThrowsAsync(() => ethNodeSyncing.getLocalSyncingResponse({address, port}))
    })
  })

  describe('ethNodeSyncing.syncProgressMade', () => {
    it('should report no progress if empty sync result', () => {
      assert.strictEqual(ethNodeSyncing.syncProgressMade({}), false)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result: false}), false)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result: false, lastUniqueResult: false}), false)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result: false, lastUniqueResult: {currentBlock: 1000, pulledStates: 200}}), false)
    })

    it('should report progress if positive sync result, but empty previous result', () => {
      const result = { currentBlock: 1000, pulledStates: 200 }
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result}), true)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: false}), true)
    })

    it('should report no progress if result is the same as previous', () => {
      const result = { currentBlock: 1000, pulledStates: 200 }
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: result}), false)
    })

    it('should report no progress if result is the same as previous', () => {
      const result = { currentBlock: 1000, pulledStates: 200 }
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: result}), false)
    })

    it('should report no progress if result is behind the previous', () => {
      const result = { currentBlock: 1000, pulledStates: 200 }
      const resultBlockAhead = Object.assign({}, result, {currentBlock: 1001})
      const resultStateAhead = Object.assign({}, result, {pulledStates: 201})
      const resultBothAhead = Object.assign({}, result, {currentBlock: 1001, pulledStates: 201})
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: resultBlockAhead}), false)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: resultStateAhead}), false)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: resultBothAhead}), false)
    })

    it('should report progress if result is ahead of the previous', () => {
      const result = { currentBlock: 1000, pulledStates: 200 }
      const resultBlockBehind = Object.assign({}, result, {currentBlock: 999})
      const resultStateBehind = Object.assign({}, result, {pulledStates: 199})
      const resultBothBehind = Object.assign({}, result, {currentBlock: 999, pulledStates: 199})
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: resultBlockBehind}), true)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: resultStateBehind}), true)
      assert.strictEqual(ethNodeSyncing.syncProgressMade({result, lastUniqueResult: resultBothBehind}), true)
    })
  })
})
