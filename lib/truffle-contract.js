const truffleContractBase = require('truffle-contract')
const truffleContractFix = require('./truffle-contract-fix')
const ethereumNetwork = require('./ethereum-network')

module.exports = exports = (contractJson, web3Instance) => {
  const w3 = (web3Instance || web3)

  // load
  if (typeof contractJson === 'string' || contractJson instanceof String) {
    contractJson = require(contractJson)
  }

  // override web3 if possible
  truffleContractBase.web3 = w3

  // make contract
  contract = truffleContractBase(contractJson)

  // set provider; web3 must be in-scope or provided.
  contract.setProvider(w3.currentProvider)
  contract.web3 = w3

  // apply fix (requires provider to be set)
  truffleContractFix(contract)

  // apply 'from' as the default account
  if (w3.eth.defaultAccount) {
    contract.defaults({from: w3.eth.defaultAccount})
  }

  // done!
  return contract
}

exports.getAddress = (contractJson, network) => {
  if (typeof contractJson === 'string' || contractJson instanceof String) {
    contractJson = require(contractJson)
  }

  const networkId = ethereumNetwork.getId(network)
  return contractJson["networks"][networkId]["address"];
}
