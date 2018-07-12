const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = (sum, a, b, message) => {
  const biSum = BigNumber(sum);
  const biA = BigNumber(a);
  const biB = BigNumber(b);
  const equals = biSum.isEqualTo(biA.plus(biB));
  if (!equals) {
    const formatString = `${cpRed}%s\n${cpGreen}+ Expected ${cpRed}- Actual\n${cpGreen}%s\n${cpRed}%s${cpReset}\n`;
    const errorString = `Error: expected ${sum} to equal the sum of ${a} and ${b} as BigNumbers`;
    let assertMessage = format(formatString, errorString, `${biA.plus(biB)} (= ${biA} + ${biB})`, `${biSum}`);
    if (message) {
      assertMessage = `${message}\n${assertMessage}`;
    }
    assert(false, assertMessage);
  }
}
