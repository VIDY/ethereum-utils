'use strict'

const readdirSync = require('fs').readdirSync
const camelCase = require('camel-case')

module.exports = (path) => {
  const modules = {}

  readdirSync(path)
    .filter((filename) => {
      return filename.endsWith('.js') && !filename.endsWith('.test.js')
    })
    .forEach((filename) => {
      const libName = camelCase(filename.slice(0, -3))
      modules[libName] = require(`${path}/${filename}`)
    })

  return modules
}
