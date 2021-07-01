const ethers = require('ethers');

module.exports = exports = () => {
  return ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16));
}
