const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = (number1, number2, message) => {
  const bi1 = BigNumber(number1);
  const bi2 = BigNumber(number2);
  const equals = bi1.isEqualTo(bi2);
  if (!equals) {
    const formatString = `${cpRed}%s\n${cpGreen}+ Expected ${cpRed}- Actual\n${cpGreen}%s\n${cpRed}%s${cpReset}\n`;
    const errorString = `Error: expected ${number1} to equal ${number2} as BigNumbers`;
    let assertMessage = format(formatString, errorString, `${bi2}`, `${bi1}`);
    if (message) {
      assertMessage = `${message}\n${assertMessage}`;
    }
    assert(false, assertMessage);
  }
}
