const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = (number, maximum, message) => {
  const biNumber = BigNumber(number);
  const biMaximum = BigNumber(maximum);
  if (!biNumber.isLessThanOrEqualTo(biMaximum)) {
    const formatString = `${cpRed}%s\n${cpGreen}+ Expected ${cpRed}- Actual\n${cpGreen}%s\n${cpRed}%s${cpReset}\n`;
    const errorString = `Error: expected ${number} to be >= ${maximum} as BigNumbers`;
    let assertMessage = format(formatString, errorString, `${biMaximum}`, `${biNumber}`);
    if (message) {
      assertMessage = `${message}\n${assertMessage}`;
    }
    assert(false, assertMessage);
  }
}
