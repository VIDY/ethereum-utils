'use strict'

const sinon = require('sinon')
const assert = require('chai').assert
const nock = require('nock')
const assertThrowsAsync = require('assert-throws-async')
const walletCreate = require('./wallet-create')

describe('wallet-create.js', () => {
  const sandbox = sinon.createSandbox()
  const clock = sinon.useFakeTimers()

  const mnemonic = 'degree program harvest such medal galaxy slide upset ozone wedding custom shaft';

  it('should generate wallet if no mnemonic specified', () => {
    const wallet = walletCreate();
    assert.ok(!!wallet.publicKey);
    assert.ok(!!wallet.privateKey);
  })

  it('should generate wallet based on mnemonic', () => {
    const wallet = walletCreate({ mnemonic });
    assert.equal(wallet.address, '0xa6f2e21491F77bDC95c6B34f95DdEe194A7f69be');
    assert.equal(wallet.publicKey, '0x04eab49fc6c97c9778fea25664d35908f076294f9a2a6cafdfe0c7f81d9613dc4b1a767bb13896d851275b97dbfcb5c755fb2b79e5555def7cfffaf22308931ab3');
    assert.equal(wallet.privateKey, '0x95c78be1987fb69346659ad5bfc34f075114bcd37b7f8d39fc2f6aab49d0ae69');
  });

  it('should generate wallet based on mnemonic and index', () => {
    let wallet = walletCreate({ mnemonic, index:0 });
    assert.equal(wallet.address, '0xa6f2e21491F77bDC95c6B34f95DdEe194A7f69be');
    assert.equal(wallet.publicKey, '0x04eab49fc6c97c9778fea25664d35908f076294f9a2a6cafdfe0c7f81d9613dc4b1a767bb13896d851275b97dbfcb5c755fb2b79e5555def7cfffaf22308931ab3');
    assert.equal(wallet.privateKey, '0x95c78be1987fb69346659ad5bfc34f075114bcd37b7f8d39fc2f6aab49d0ae69');

    wallet = walletCreate({ mnemonic, index:10 });
    assert.equal(wallet.address, '0x2366a8DC7Dc0E96a689733664026043188Eef3bb');
    assert.equal(wallet.publicKey, '0x04eabe3f9052838ac2532c91011852ca641fce0288365b48ab8850b57932a583aa7aafb0376fb5c97ed4f8ca6276b49e5980058774dd8e57507379a3a5fa5d78b8');
    assert.equal(wallet.privateKey, '0xb785256cd2f2aa7993ca26db7ab9ba60ff5618783ef8088b3e472836211138b3');
  });
})
