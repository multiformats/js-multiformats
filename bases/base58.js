'use strict'
const baseX = require('base-x')
const bytes = require('../bytes')
const { Buffer } = require('buffer')

const wrap = obj => ({
  encode: b => obj.encode(Buffer.from(b)),
  decode: s => bytes.coerce(obj.decode(s))
})

const btc = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const flickr = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'

module.exports = [
  { name: 'base58btc', prefix: 'z', ...wrap(baseX(btc)) },
  { name: 'base58flickr', prefix: 'Z', ...wrap(baseX(flickr)) }
]
