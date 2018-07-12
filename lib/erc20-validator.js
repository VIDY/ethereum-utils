const BigNumber = require('bignumber.js');
const { assertNumbersEqual, assertNumberIsSum, assertNumberIsDifference } = require('./assert-big-number')
const assertRevert = require('./assert-revert');

module.exports = async ({token, supply, decimals, name, symbol, accounts, balances, allowances}) => {
  for (const func of validationFunctions) {
    await func({token, supply, decimals, name, symbol, accounts, balances, allowances});
  }
}

const safeValidation = (message, func) => {
  return async (args) => {
    try {
      await func(args);
    } catch (err) {
      const taggedMessage = `EIP20 Validator:: ${message}`
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
    `arguments: token accounts should have the specified allowances`,
    async ({token, accounts, allowances}) => {
      if (accounts && allowances) {
        for (var index = 0; index < accounts.length; index++) {
          const account = accounts[index];
          for (var index2 = 0; index2 < accounts.length; index2++) {
            if (index == index2) {
              continue;
            }
            const accountSpender = accounts[index2];
            const allowance = allowances[account] ? allowances[account][accountSpender] || 0 : 0;
            const tokenAllowance = await token.allowance.call(account, accountSpender);
            assertNumbersEqual(tokenAllowance, allowance, `account ${index} didn't start with account ${index2} having the specified allowance ${allowance}`);
          }
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
    `approve: accounts[0] should approve 100 to accounts[1]`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 2 && balances[accounts[0]] >= 100) {
        // always start with 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        await token.approve(accounts[1], 100, { from: accounts[0] });
        const allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance.toNumber(), 100);
      }
    }
  ),

  safeValidation(
    `approve: accounts[0] should approve 100 to accounts[1] who withdraws 20 once`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 3 && balances[accounts[0]] >= 100) {
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(accounts[1]);
        const balance2 = await token.balanceOf.call(accounts[2]);

        // always start with 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        await token.approve(accounts[1], 100, { from: accounts[0] });
        const allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance.toNumber(), 100);

        await token.transferFrom.call(accounts[0], accounts[2], 20, { from: accounts[1] });
        await token.allowance.call(accounts[0], accounts[1]);
        await token.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] }); // -20
        const allowance01 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance01.toNumber(), 80); // =80

        const balance0_after = await token.balanceOf.call(accounts[0]);
        const balance1_after = await token.balanceOf.call(accounts[1]);
        const balance2_after = await token.balanceOf.call(accounts[2]);

        await assertNumberIsDifference(balance0_after, balance0, 20);
        await assertNumbersEqual(balance1_after, balance1);
        await assertNumberIsSum(balance2_after, balance2, 20);

        // transfer back
        await token.transfer(accounts[0], 20, {from: accounts[2]});
        const balance0_revert = await token.balanceOf.call(accounts[0]);
        const balance2_revert = await token.balanceOf.call(accounts[2]);
        await assertNumbersEqual(balance0_revert, balance0);
        await assertNumbersEqual(balance2_revert, balance2);
      }
    }
  ),

  safeValidation(
    `approve: accounts[0] should approve 100 to accounts[1] who withdraws 20 twice`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 3 && balances[accounts[0]] >= 100) {
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(accounts[1]);
        const balance2 = await token.balanceOf.call(accounts[2]);

        // always start with 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        await token.approve(accounts[1], 100, { from: accounts[0] });
        const allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance.toNumber(), 100);

        // transfer 20
        await token.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] }); // -20
        const allowance01 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance01.toNumber(), 80); // =80

        const balance0_after = await token.balanceOf.call(accounts[0]);
        const balance1_after = await token.balanceOf.call(accounts[1]);
        const balance2_after = await token.balanceOf.call(accounts[2]);

        await assertNumberIsDifference(balance0_after, balance0, 20);
        await assertNumbersEqual(balance1_after, balance1);
        await assertNumberIsSum(balance2_after, balance2, 20);

        // transfer 20 again
        await token.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] }); // -20
        const allowance02 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance02.toNumber(), 60); // =60

        const balance0_after2 = await token.balanceOf.call(accounts[0]);
        const balance1_after2 = await token.balanceOf.call(accounts[1]);
        const balance2_after2 = await token.balanceOf.call(accounts[2]);

        await assertNumberIsDifference(balance0_after2, balance0, 40);
        await assertNumbersEqual(balance1_after2, balance1);
        await assertNumberIsSum(balance2_after2, balance2, 40);

        // transfer back
        await token.transfer(accounts[0], 40, {from: accounts[2]});
        const balance0_revert = await token.balanceOf.call(accounts[0]);
        const balance2_revert = await token.balanceOf.call(accounts[2]);
        await assertNumbersEqual(balance0_revert, balance0);
        await assertNumbersEqual(balance2_revert, balance2);
      }
    }
  ),

  safeValidation(
    `approve: accounts[0] should approve 100 to accounts[1] who withdraws 50 & 60 (2nd tx should fail)`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 3 && balances[accounts[0]] >= 100) {
        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(accounts[1]);
        const balance2 = await token.balanceOf.call(accounts[2]);

        // always start with 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        await token.approve(accounts[1], 100, { from: accounts[0] });
        const allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance.toNumber(), 100);

        // transfer 50
        await token.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] }); // -50
        const allowance01 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance01.toNumber(), 50); // =50

        const balance0_after = await token.balanceOf.call(accounts[0]);
        const balance1_after = await token.balanceOf.call(accounts[1]);
        const balance2_after = await token.balanceOf.call(accounts[2]);

        await assertNumberIsDifference(balance0_after, balance0, 50);
        await assertNumbersEqual(balance1_after, balance1);
        await assertNumberIsSum(balance2_after, balance2, 50);

        // transfer 60 (fail)
        await assertRevert(token.transferFrom.call(accounts[0], accounts[2], 60, { from: accounts[1] }));

        // transfer back
        await token.transfer(accounts[0], 50, {from: accounts[2]});
        const balance0_revert = await token.balanceOf.call(accounts[0]);
        const balance2_revert = await token.balanceOf.call(accounts[2]);
        await assertNumbersEqual(balance0_revert, balance0);
        await assertNumbersEqual(balance2_revert, balance2);
      }
    }
  ),

  safeValidation(
    `approve: attempt withdraw from account with no allowance (should fail)`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 3 && balances[accounts[0]] >= 100) {
        // set approval to zero
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        // transfer 60 (fail)
        await assertRevert(token.transferFrom.call(accounts[0], accounts[2], 60, { from: accounts[1] }));
      }
    }
  ),

  safeValidation(
    `approve: accounts[0] should approve 100 to accounts[1] who withdraws 50, then approve 0 and fail transfer`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 3 && balances[accounts[0]] >= 100) {

        const balance0 = await token.balanceOf.call(accounts[0]);
        const balance1 = await token.balanceOf.call(accounts[1]);
        const balance2 = await token.balanceOf.call(accounts[2]);

        // always start with 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        await token.approve(accounts[1], 100, { from: accounts[0] });
        const allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance.toNumber(), 100);

        // transfer 50
        await token.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] }); // -50
        const allowance01 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance01.toNumber(), 50); // =50

        const balance0_after = await token.balanceOf.call(accounts[0]);
        const balance1_after = await token.balanceOf.call(accounts[1]);
        const balance2_after = await token.balanceOf.call(accounts[2]);

        await assertNumberIsDifference(balance0_after, balance0, 50);
        await assertNumbersEqual(balance1_after, balance1);
        await assertNumberIsSum(balance2_after, balance2, 50);

        // set 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance00 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance00.toNumber(), 0);

        // fail transfer
        await assertRevert(token.transferFrom.call(accounts[0], accounts[2], 10, { from: accounts[1] }));

        // transfer back
        await token.transfer(accounts[0], 50, {from: accounts[2]});
        const balance0_revert = await token.balanceOf.call(accounts[0]);
        const balance2_revert = await token.balanceOf.call(accounts[2]);
        await assertNumbersEqual(balance0_revert, balance0);
        await assertNumbersEqual(balance2_revert, balance2);
      }
    }
  ),

  safeValidation(
    `approve: accounts[0] should approve max (2^256 - 1) to accounts[1]`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 2 && balances[accounts[0]] >= 100) {
        // always start with 0 approval
        await token.approve(accounts[1], 0, { from: accounts[0] });
        const allowance0 = await token.allowance.call(accounts[0], accounts[1]);
        assert.strictEqual(allowance0.toNumber(), 0);

        await token.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] });
        const allowance = await token.allowance.call(accounts[0], accounts[1]);
        assert(allowance.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77'));
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
      }
    }
  ),

  safeValidation(
    `events: Approval event should fire`,
    async ({token, accounts, balances}) => {
      if (accounts && accounts.length >= 2 && balances[accounts[0]] > 176) {
        // always start with 0 approval
        const res0 = await token.approve(accounts[1], 0, { from: accounts[0] });
        const transferLog0 = res0.logs.find(element => element.event.match('Approval'));
        assert.strictEqual(transferLog0.args.owner, accounts[0]);
        assert.strictEqual(transferLog0.args.spender, accounts[1]);
        assert.strictEqual(transferLog0.args.value.toString(), '0');

        // approve 176
        const res = await token.approve(accounts[1], '176', { from: accounts[0] });
        const transferLog = res.logs.find(element => element.event.match('Approval'));
        assert.strictEqual(transferLog.args.owner, accounts[0]);
        assert.strictEqual(transferLog.args.spender, accounts[1]);
        assert.strictEqual(transferLog.args.value.toString(), '176');
      }
    }
  )
]
