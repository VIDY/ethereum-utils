'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const ethNodeDummyServer = require('./eth-node-dummy-server')

const rp = require('request-promise')

describe('eth-node-syncing-server.js', () => {
  const sandbox = sinon.createSandbox()
  const clock = sinon.useFakeTimers()

  const port = 51234

  var server

  afterEach(() => {
    if (server) {
      server.close()
      server = null
    }

    sandbox.reset()
    sandbox.restore()
  })

  it('provide dummy status and response data', async () => {
    const status = 201
    const data = 'Dummy data'

    server = ethNodeDummyServer({
      port,
      status,
      data,
    })

    const response = await rp({
      uri: `http://localhost:${port}`,
      resolveWithFullResponse: true,
      simple: false
    })

    assert.strictEqual(response.statusCode, status)
    assert.strictEqual(response.body, data)
  })
})
