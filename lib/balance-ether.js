const BigNumber = require('bignumber.js');

module.exports = async (web3, accounts) => {
    const balances = {}
    var totalBalance = BigNumber(0);
    for (const account of accounts) {
      const balance = web3.eth.getBalance(account);
      balances[account] = BigNumber(balance);
      totalBalance = totalBalance.plus(balance);
    }
    const avg = totalBalance.dividedBy(accounts.length);
    const margin = BigNumber('1e15');
    const bank = accounts[0];
    accounts = accounts.slice(1);

    for (const account of accounts) {
      const diff = balances[account].minus(avg);
      if (diff.isGreaterThanOrEqualTo(margin)) {
        await web3.eth.sendTransaction({to: bank, from: account, value: diff.integerValue().toString()})
      }
    }

    for (const account of accounts) {
      const diff = avg.minus(balances[account]);
      if (diff.isGreaterThanOrEqualTo(margin)) {
        await web3.eth.sendTransaction({from: bank, to: account, value: diff.integerValue().toString()})
      }
    }
}
