const truffleContractBase = require('truffle-contract')
const truffleContractFix = require('./truffle-contract-fix')

module.exports = (contractJson, web3Instance) => {
  // load
  if (typeof contractJson === 'string' || contractJson instanceof String) {
    contractJson = require(contractJson)
  }

  // make contract
  contract = truffleContractBase(contractJson)

  // set provider; web3 must be in-scope or provided.
  contract.setProvider((web3Instance || web3).currentProvider)

  // apply fix (requires provider to be set)
  truffleContractFix(contract)

  // done!
  return contract
}
