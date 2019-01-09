'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const ethNodeSynced = require('./eth-node-synced')

describe('eth-node-synced.js', () => {
  const sandbox = sinon.createSandbox()

  describe('ethNodeSynced', () => {
    beforeEach(() => {
      sandbox.stub(ethNodeSynced, 'getLocalBlockNum')
      sandbox.stub(ethNodeSynced, 'getNetworkBlockNum')
    })

    afterEach(() => {
      sandbox.reset()
      sandbox.restore()
    })

    const args = {
      network: 'testNetwork',
      etherscanApiKey: 'testApiKey',
      nodeAddress: 'testNodeAddress',
      nodePort: 'testNodePort'
    }

    const argsLocalBlockNum = { address: 'testNodeAddress', port: 'testNodePort' }
    const argsNetworkBlockNum = { network: 'testNetwork', etherscanApiKey: 'testApiKey', cacheSeconds: undefined }

    it('should compare block numbers and report synced if same', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(9876))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.strictEqual(await ethNodeSynced(args), true)
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })

    it('should compare block numbers and report synced if within maxBlockDifference', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(9776))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.strictEqual(await ethNodeSynced(Object.assign({}, args, {maxBlockDifference: 100})), true)
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })

    it('should compare block numbers and report not synced if outside maxBlockDifference', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(9775))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.strictEqual(await ethNodeSynced(Object.assign({}, args, {maxBlockDifference: 100})), false)
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })

    it('should compare block numbers and report synced if within default maxBlockDifference of 3', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(9873))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.strictEqual(await ethNodeSynced(args), true)
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })

    it('should compare block numbers and report not synced if outside default maxBlockDifference of 3', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(9872))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.strictEqual(await ethNodeSynced(args), false)
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })

    it('should include block numbers in "full: true" synced response', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(9874))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.deepEqual(
        await ethNodeSynced(Object.assign({}, args, {full: true, maxBlockDifference: 100})),
        { synced: true, localBlockNum: 9874, networkBlockNum: 9876 }
      )
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })

    it('should include block numbers in "full: true" unsynced response', async () => {
      ethNodeSynced.getLocalBlockNum.callsFake(() => Promise.resolve(8111))
      ethNodeSynced.getNetworkBlockNum.callsFake(() => Promise.resolve(9876))

      assert.deepEqual(
        await ethNodeSynced(Object.assign({}, args, {full: true, maxBlockDifference: 100})),
        { synced: false, localBlockNum: 8111, networkBlockNum: 9876 }
      )
      assert.deepEqual(ethNodeSynced.getLocalBlockNum.args[0][0], argsLocalBlockNum)
      assert.deepEqual(ethNodeSynced.getNetworkBlockNum.args[0][0], argsNetworkBlockNum)
    })
  })

  describe('ethNodeSynced.getNetworkBlockNum', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('should parse block number from successful response', async () => {
      const etherscanApiKey = 'apiKey'
      nock(`https://api.etherscan.io`)
        .get('/api')
        .query({
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: etherscanApiKey
        })
        .reply(200, {
          id: 83,
          jsonrpc: "2.0",
          result: 77
        })

      assert.strictEqual(await ethNodeSynced.getNetworkBlockNum({etherscanApiKey}), 77)
    })

    it('should use specified network', async () => {
      const etherscanApiKey = 'apiKey'
      const network = 'nonsense'
      nock(`https://${network}.etherscan.io`)
        .get('/api')
        .query({
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: etherscanApiKey
        })
        .reply(200, {
          id: 83,
          jsonrpc: "2.0",
          result: 77
        })

      assert.strictEqual(await ethNodeSynced.getNetworkBlockNum({network, etherscanApiKey}), 77)
    })

    it('should use "api" for main network', async () => {
      const etherscanApiKey = 'apiKey'
      const network = 'main'
      nock(`https://api.etherscan.io`)
        .get('/api')
        .query({
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: etherscanApiKey
        })
        .reply(200, {
          id: 83,
          jsonrpc: "2.0",
          result: 77
        })

      assert.strictEqual(await ethNodeSynced.getNetworkBlockNum({network, etherscanApiKey}), 77)
    })

    it('should reject for bad response', async () => {
      const etherscanApiKey = 'apiKey'
      nock(`https://api.etherscan.io`)
        .get('/api')
        .query({
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: etherscanApiKey
        })
        .reply(500)

      assertThrowsAsync(() => ethNodeSynced.getNetworkBlockNum({etherscanApiKey}))
    })
  })

  describe('ethNodeSynced.getLocalBlockNum', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('should parse block number from successful response', async () => {
      const address = 'www.pretendnode.com'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_blockNumber',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result: 4
        })

      assert.strictEqual(await ethNodeSynced.getLocalBlockNum({address, port}), 4)
    })

    it('should reject on failure', async () => {
      const address = 'www.pretendnode.com'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_blockNumber',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(500)

      assertThrowsAsync(() => ethNodeSynced.getLocalBlockNum({address, port}))
    })

    it(`address should default to localhost`, async () => {
      const address = 'localhost'
      const port = 7545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_blockNumber',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result: 4
        })

      assert.strictEqual(await ethNodeSynced.getLocalBlockNum({port}), 4)
    })

    it('port should default to 8545', async () => {
      const address = 'www.pretendnode.com'
      const port = 8545
      nock(`http://${address}:${port}`)
        .post('/', {
          method: 'eth_blockNumber',
          params: [],
          id: 1,
          jsonrpc: "2.0"
        })
        .reply(200, {
          id: 1,
          jsonrpc: "2.0",
          result: 4
        })

      assert.strictEqual(await ethNodeSynced.getLocalBlockNum({address}), 4)
    })
  })
})
