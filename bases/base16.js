import { fromHex, toHex } from 'multiformats/bytes.js'

const create = function base16 (alphabet) {
  return {
    encode: input => toHex(input),
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

export default { prefix: 'f', name: 'base16', ...create('0123456789abcdef') }
