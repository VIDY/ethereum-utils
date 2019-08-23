'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const Web3 = require('web3')
const truffleContract = require('../lib/truffle-contract')

const vidyCoinJson = require('../fixture/VidyCoin');

describe('truffle-contract.js', () => {
  const sandbox = sinon.createSandbox()

  describe('web3', () => {
    it('should connect to http://localhost:8545', async () => {
      const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      const listening = await web3.eth.net.isListening();
      assert.isOk(listening, '~> web3 is listening');
    });

    it('should receive network ID', async () => {
      const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      const networkId = await web3.eth.net.getId();
      assert.isOk(networkId, `~> web3 has network ID ${networkId}`);
    });
  });

  describe('truffleContract', () => {
    let web3, VidyCoin;

    it('should access deployed VidyCoin contract',  async () => {
      const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      const VidyCoin = truffleContract(vidyCoinJson, web3);

      assert.isOk(VidyCoin, '~> has contract interface')
      const vidyCoin = await VidyCoin.deployed();
      assert.isOk(vidyCoin, '~> has deployed VidyCoin');
    });

    it('should be able to run queries', async () => {
      const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      const VidyCoin = truffleContract(vidyCoinJson, web3);
      const vidyCoin = await VidyCoin.deployed();

      const balance = await vidyCoin.balanceOf.call('0x0000000000000000000000000000000000000000');
      assert.isOk(true, `received balance ${balance}`);
    });
  });
});
