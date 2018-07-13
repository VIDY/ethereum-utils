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

const arrayContainsAny = (array, elements) => {
  for (const element of elements) {
    if (array.includes(element.toString().toLowerCase())) {
      return true;
    }
  }
  return false;
}

const networkHasAnyFlag = (network, flags) => {
  const providedNetworkFlags = network.toString().split('_').map((val) => val.toLowerCase());
  return arrayContainsAny(providedNetworkFlags, flags);
}

const networkFlags = {
  live: ['1', 'live', 'main', 'mainnet', 'frontier', 'homestead', 'home', 'metropolis'],
  morden: ['2', 'morden'],
  ropsten: ['3', 'ropsten'],
  rinkeby: ['4', 'rinkeby'],
  kovan: ['42', 'kovan'],
  sokol: ['77', 'sokol'],
  poa: ['99', 'poa'],
  ganache: ['5777', 'ganache', 'test'],
  musicoin: ['7762959', 'mosicoin']
}

module.exports = exports = {
  isLive: (network) => networkHasAnyFlag(network, networkFlags.live),
  isMain: (network) => networkHasAnyFlag(network, networkFlags.live),
  isMainnet: (network) => networkHasAnyFlag(network, networkFlags.live),
  isHome: (network) => networkHasAnyFlag(network, networkFlags.live),
  isMorden: (network) => networkHasAnyFlag(network, networkFlags.morden),
  isRopsten: (network) => networkHasAnyFlag(network, networkFlags.ropsten),
  isRinkeby: (network) => networkHasAnyFlag(network, networkFlags.rinkeby),
  isKovan: (network) => networkHasAnyFlag(network, networkFlags.kovan),
  isSokol: (network) => networkHasAnyFlag(network, networkFlags.sokol),
  isPoa: (network) => networkHasAnyFlag(network, networkFlags.poa),
  isGanache: (network) => networkHasAnyFlag(network, networkFlags.ganache),
  isMusicoin: (network) => networkHasAnyFlag(network, networkFlags.musicoin)
}
