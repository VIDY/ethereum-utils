const ethers = require('ethers');

const walletCreateMnemonic = require('./wallet-create-mnemonic');
const walletCreate = require('./wallet-create');

class WalletFactory {
  constructor(mnemonic) {
    this.mnemonic = () => mnemonic;
  }

  get(index) {
    const mnemonic = this.mnemonic();
    return walletCreate({ mnemonic, index });
  }

  slice(start, end) {
    const mnemonic = this.mnemonic();
    const length = end - start;
    if (isNaN(start) || isNaN(end) || isNaN(len)) throw new Error(`Must specify both start and end`);
    if (isNaN(length)) throw new Error(`Must specify both start and end`);
    if (length <= 0) return [];
    return Array.from({length}, (_, i) => walletCreate({ mnemonic, index:i + start}));
  }

  range(start, stop, step) {
    if (start == null) throw new Error(`Must specify at least one argument`);
    if (step == 0) throw new Error(`Must have nonzero step`);
    if (stop == null) {
      stop = start;
      start = 0;
    }
    if (step == null) {
      step = start <= stop ? 1 : -1;
    }

    if ((step > 0) != (stop >= start)) {
      throw new Error(`Step direction must agree with defined range`);
    }

    const mnemonic = this.mnemonic();
    const width = Math.abs(stop - start);
    const length = Math.floor(width / Math.abs(step));
    return Array.from({length}, (_, i) => walletCreate({ mnemonic, index: start + i * step }));
  }
}

module.exports = exports = (opts = {}) => {
  // set and test mnemonic
  let mnemonic = (typeof opts == 'string') ? opts : opts.mnemonic;
  if (!mnemonic) mnemonic = walletCreateMnemonic();
  walletCreate({ mnemonic });   // throws?

  // create factory
  return new WalletFactory(mnemonic);
}
