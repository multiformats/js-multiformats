'use strict'
const baseX = require('base-x')

module.exports = [
  { name: 'base58btc', prefix: 'z', ...baseX('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz') },
  { name: 'base58flickr', prefix: 'Z', ...baseX('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ') }
]
