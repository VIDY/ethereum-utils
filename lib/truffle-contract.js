const truffleContractBase = require('truffle-contract')
const truffleContractFix = require('./truffle-contract-fix')

module.exports = (contractJson, web3Instance) => {
  // load
  if (typeof contractJson === 'string' || contractJson instanceof String) {
    contractJson = require(contractJson)
  }

  // make contract and apply fix
  contract = truffleContractBase(contractJson)
  truffleContractFix(contract)

  // set provider; web3 must be in-scope or provided.
  contract.setProvider((web3Instance || web3).currentProvider);

  // done!
  return contract
}
