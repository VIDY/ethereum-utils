const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = (diff, a, b, message) => {
  const biDiff = BigNumber(diff);
  const biA = BigNumber(a);
  const biB = BigNumber(b);
  const equals = biDiff.isEqualTo(biA.minus(biB));
  if (!equals) {
    const formatString = `${cpRed}%s\n${cpGreen}+ Expected ${cpRed}- Actual\n${cpGreen}%s\n${cpRed}%s${cpReset}\n`;
    const errorString = `Error: expected ${diff} to equal the difference of ${a} and ${b} as BigNumbers`;
    let assertMessage = format(formatString, errorString, `${biA.minus(biB)} (= ${biA} - ${biB})`, `${biDiff}`);
    if (message) {
      assertMessage = `${message}\n${assertMessage}`;
    }
    assert(false, assertMessage);
  }
}
