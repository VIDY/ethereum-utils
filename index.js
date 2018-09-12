'use strict'

module.exports = Object.assign(
  {},
  require('ethjs-util'),
  require('./lib/require-dir')(`${__dirname}/lib`)
)
