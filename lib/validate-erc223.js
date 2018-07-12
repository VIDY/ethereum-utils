const BigNumber = require('bignumber.js');
const assertNumbersEqual = require('./assert-numbers-equal')
const assertNumberIsSum = require('./assert-number-is-sum')
const assertNumberIsDifference = require('./assert-number-is-difference')
const assertRevert = require('./assert-revert');

module.exports = async ({token, supply, decimals, name, symbol, accounts, balances, receivers}) => {
  for (const func of validationFunctions) {
    await func({token, receivers, supply, decimals, name, symbol, accounts, balances, receivers});
  }
}

const safeValidation = (message, func) => {
  return async (args) => {
    try {
      await func(args);
    } catch (err) {
      const taggedMessage = `EIP223 Validator:: ${message}`
      err.message = err.message ? `${taggedMessage}\n${err.message}` : taggedMessage;
      throw err;
    }
  }
}

const validationFunctions = [
  safeValidation(
    `arguments: token should have the specified totalSupply`,
    async ({token, supply}) => {
      assertNumbersEqual(await token.totalSupply.call(), supply);
    }
  ),

  safeValidation(
    `arguments: token should have the specified decimals`,
    async ({token, decimals}) => {
      assert.strictEqual((await token.decimals.call()).toNumber(), decimals);
    }
  ),

  safeValidation(
    `arguments: token should have the specified name`,
    async ({token, name}) => {
      assert.strictEqual(await token.name.call(), name);
    }
  ),

  safeValidation(
    `arguments: token should have the specified symbol`,
    async ({token, symbol}) => {
      assert.strictEqual(await token.symbol.call(), symbol);
    }
  ),

  safeValidation(
    `arguments: token accounts should have the specified balances`,
    async ({token, accounts, balances}) => {
      if (accounts && balances) {
        for (var index = 0; index < accounts.length; index++) {
          const account = accounts[index];
          const balance = balances[account] || 0;
          const tokenBalance = await token.balanceOf.call(account);
          assertNumbersEqual(tokenBalance, balance, `account ${index} didn't start with the specified balance ${balance}`);
        }
      }
    }
  ),

  safeValidation(
    `transfer: ether transfers should be reversed`,
    async ({token, accounts}) => {
      if (accounts) {
        const balanceBefore = await token.balanceOf.call(accounts[0]);

        await assertRevert(new Promise((resolve, reject) => {
          web3.eth.sendTransaction({ from: accounts[0], to: token.address, value: web3.toWei('10', 'Ether') }, (err, res) => {
            if (err) { reject(err); }
            resolve(res);
          });
        }));

        const balanceAfter = await token.balanceOf.call(accounts[0]);
        assertNumbersEqual(balanceBefore, balanceAfter, 'ether transfer changed the token balance...?');
      }
    }
  ),

  safeValidation(
    `transfer: token transfers should be reversed`,
    async ({token, accounts}) => {
      if (accounts) {
        const contractAddress = await token.address;
        await assertRevert(token.transfer.call(contractAddress, 0, { from: accounts[0] }));
      }
    }
  ),

  safeValidation(
    `transfer: should transfer 10 token between accounts successfully`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length > 2 && balances && balances[accounts[0]] >= 10) {
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(accounts[1]);

        await token.transfer(accounts[1], 10, {from: accounts[0]});

        const balance0_after = await token.balanceOf.call(accounts[0]);
        const balance1_after = await token.balanceOf.call(accounts[1]);
        assertNumberIsDifference(balance0_after, balance0, 10);
        assertNumberIsSum(balance1_after, balance1, 10);

        await token.transfer(accounts[0], 10, {from: accounts[1]});

        const balance0_revert = await token.balanceOf.call(accounts[0]);
        const balance1_revert = await token.balanceOf.call(accounts[1]);
        assertNumbersEqual(balance0_revert, balance0);
        assertNumbersEqual(balance1_revert, balance1);
      }
    }
  ),

  safeValidation(
    `transfer: should fail when transfering more tokens than in the account`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length > 2 && balances && balances[accounts[0]]) {
        await assertRevert(token.transfer.call(accounts[1], BigNumber(balances[accounts[0]]).plus(1).toString(), {from: accounts[0]}));
      }
    }
  ),

  safeValidation(
    `transfer: zero-transfer should succeed normally`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length > 2) {
        assert(await token.transfer.call(accounts[1], 0, { from: accounts[0] }));
      }
    }
  ),

  safeValidation(
    `transfer: should transfer to a contract capable of receiving ERC233 tokens`,
    async ({token, accounts, balances, receivers}) => {
      if (accounts && balances[accounts[0]] > 1 && receivers && receivers.pass) {
        const receiver = receivers.pass.address || receivers.pass;
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(receiver);

        await token.transfer(receiver, 1, {from: accounts[0]});

        const balance0_after = await token.balanceOf.call(accounts[0]);
        const balance1_after = await token.balanceOf.call(receiver);
        assertNumberIsDifference(balance0_after, balance0, 1);
        assertNumberIsSum(balance1_after, balance1, 1);

        balances[accounts[0]] = balance0_after;
        balances[receiver] = balance1_after;
      }
    }
  ),

  safeValidation(
    `transfer: should fail to transfer to a contract not capable of receiving ERC233 tokens`,
    async ({token, accounts, balances, receivers}) => {
      if (accounts && balances[accounts[0]] > 1 && receivers && receivers.fail) {
        const receiver = receivers.fail.address || receivers.fail;
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(receiver);

        await assertRevert(token.transfer.call(receiver, 1, {from: accounts[0]}));
      }
    }
  ),

  safeValidation(
    `transfer: should fail to transfer to a contract whose ERC233 receipt method reverts`,
    async ({token, accounts, balances, receivers}) => {
      if (accounts && balances[accounts[0]] > 1 && receivers && receivers.revert) {
        const receiver = receivers.revert.address || receivers.revert;
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(receiver);

        await assertRevert(token.transfer.call(receiver, 1, {from: accounts[0]}));
      }
    }
  ),

  safeValidation(
    `events: Transfer event should fire for a transfer`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 2 && balances[accounts[0]] > 176) {
        const res = await token.transfer(accounts[1], '176', { from: accounts[0] });
        const transferLog = res.logs.find(element => element.event.match('Transfer'));
        assert.strictEqual(transferLog.args.from, accounts[0]);
        assert.strictEqual(transferLog.args.to, accounts[1]);
        assert.strictEqual(transferLog.args.value.toString(), '176');
        assert.strictEqual(transferLog.args.data, '0x');

        // revert
        await token.transfer(accounts[0], '176', { from: accounts[1] });
      }
    }
  ),

  safeValidation(
    `events: Transfer event should fire for a 0 transfer`,
    async ({token, accounts}) => {
      if (accounts && accounts.length >= 2) {
        const res = await token.transfer(accounts[1], '0', { from: accounts[0] });
        const transferLog = res.logs.find(element => element.event.match('Transfer'));
        assert.strictEqual(transferLog.args.from, accounts[0]);
        assert.strictEqual(transferLog.args.to, accounts[1]);
        assert.strictEqual(transferLog.args.value.toString(), '0');
        assert.strictEqual(transferLog.args.data, '0x');
      }
    }
  ),

  safeValidation(
    `events: Transfer event should fire for a transfer to a contract`,
    async ({token, accounts, balances, receivers}) => {
      if (accounts && balances[accounts[0]] > 1 && receivers && receivers.pass) {
        const receiver = receivers.pass.address || receivers.pass;
        const res = await token.transfer(receiver, '1', { from: accounts[0] });
        const transferLog = res.logs.find(element => element.event.match('Transfer'));
        assert.strictEqual(transferLog.args.from, accounts[0]);
        assert.strictEqual(transferLog.args.to, receiver);
        assert.strictEqual(transferLog.args.value.toString(), '1');
        assert.strictEqual(transferLog.args.data, '0x');
      }
    }
  ),

  safeValidation(
    `events: Transfer event should fire for 0-value transfer to a contract`,
    async ({token, accounts, balances, receivers}) => {
      if (accounts && balances[accounts[0]] > 1 && receivers && receivers.pass) {
        const receiver = receivers.pass.address || receivers.pass;
        const res = await token.transfer(receiver, '0', { from: accounts[0] });
        const transferLog = res.logs.find(element => element.event.match('Transfer'));
        assert.strictEqual(transferLog.args.from, accounts[0]);
        assert.strictEqual(transferLog.args.to, receiver);
        assert.strictEqual(transferLog.args.value.toString(), '0');
        assert.strictEqual(transferLog.args.data, '0x');
      }
    }
  )
]
