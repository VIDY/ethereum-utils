const ethers = require('ethers');

const walletCreateMnemonic = require('./wallet-create-mnemonic');

module.exports = exports = (opts = {}) => {
  let { mnemonic, index } = opts
  if (!mnemonic) mnemonic = walletCreateMnemonic();
  index = (!!index) ? parseInt(index, 10) : 0;
  const path = `m/44'/60'/0'/0/${index}`;
  return ethers.Wallet.fromMnemonic(mnemonic, path);
}
