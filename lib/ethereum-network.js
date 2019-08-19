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
  mainnet: ['1', 'mainnet', 'main', 'live', 'frontier', 'homestead', 'home', 'metropolis'],
  morden: ['2', 'morden'],
  ropsten: ['3', 'ropsten'],
  rinkeby: ['4', 'rinkeby'],
  kovan: ['42', 'kovan'],
  sokol: ['77', 'sokol'],
  poa: ['99', 'poa'],
  ganache: ['5777', '4447', 'ganache', 'test'],
  musicoin: ['7762959', 'mosicoin']
}

module.exports = exports = {
  isLive: (network) => networkHasAnyFlag(network, networkFlags.mainnet),
  isMain: (network) => networkHasAnyFlag(network, networkFlags.mainnet),
  isMainnet: (network) => networkHasAnyFlag(network, networkFlags.mainnet),
  isHome: (network) => networkHasAnyFlag(network, networkFlags.mainnet),
  isMorden: (network) => networkHasAnyFlag(network, networkFlags.morden),
  isRopsten: (network) => networkHasAnyFlag(network, networkFlags.ropsten),
  isRinkeby: (network) => networkHasAnyFlag(network, networkFlags.rinkeby),
  isKovan: (network) => networkHasAnyFlag(network, networkFlags.kovan),
  isSokol: (network) => networkHasAnyFlag(network, networkFlags.sokol),
  isPoa: (network) => networkHasAnyFlag(network, networkFlags.poa),
  isGanache: (network) => networkHasAnyFlag(network, networkFlags.ganache),
  isMusicoin: (network) => networkHasAnyFlag(network, networkFlags.musicoin),
  getId: (network) => {
    for (const networkName in networkFlags) {
      if (networkHasAnyFlag(network, networkFlags[networkName])) {
        return networkFlags[networkName][0]
      }
    }
    throw new Error(`Can't identify network ID for ${network}`)
  },
  getName: (network) => {
    for (const networkName in networkFlags) {
      if (networkHasAnyFlag(network, networkFlags[networkName])) {
        return networkName
      }
    }
    throw new Error(`Can't identify network name for ${network}`)
  }
}
