const BigNumber = require('bignumber.js');
const { format } = require('util');

const cpGreen = '\x1b[32m';
const cpRed = '\x1b[31m';
const cpReset = '\x1b[0m';

module.exports = (value) => {
  BigNumber(value);
  return true;
}
