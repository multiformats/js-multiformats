'use strict'

// TODO 2020-05-03: This is slow, but simple
const fromHex = (hex) => {
  return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => {
    return parseInt(byte, 16)
  }))
}

const create = function base16 (alphabet) {
  return {
    encode: input => input.toString('hex'),
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
