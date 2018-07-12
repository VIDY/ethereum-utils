const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = exports = (value) => {
  BigNumber(value);
  return true;
}

exports.assertNumbersEqual = (number1, number2, message) => {
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

exports.assertNumberIsSum = (sum, a, b, message) => {
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

exports.assertNumberIsDifference = (diff, a, b, message) => {
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

exports.assertNumberIsGTE = (number, minimum, message) => {
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

exports.assertNumberIsLTE = (number, maximum, message) => {
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
