'use strict'
const { fromHex } = require('../bytes')
const bytes = require('../bytes')

const create = function base16 (alphabet) {
  return {
    encode: input => bytes.toHex(input),
    decode (input) {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error('invalid base16 character')
        }
      }
      return fromHex(input)
    }
  }
}

module.exports = { prefix: 'f', name: 'base16', ...create('0123456789abcdef') }
