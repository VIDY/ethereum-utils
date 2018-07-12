const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = (number, minimum, message) => {
  const biNumber = BigNumber(number);
  const biMinimum = BigNumber(minimum);
  if (!biNumber.isGreaterThanOrEqualTo(biMinimum)) {
    const formatString = `${cpRed}%s\n${cpGreen}+ Expected ${cpRed}- Actual\n${cpGreen}%s\n${cpRed}%s${cpReset}\n`;
    const errorString = `Error: expected ${number} to be >= ${minimum} as BigNumbers`;
    let assertMessage = format(formatString, errorString, `${biMinimum}`, `${biNumber}`);
    if (message) {
      assertMessage = `${message}\n${assertMessage}`;
    }
    assert(false, assertMessage);
  }
}
