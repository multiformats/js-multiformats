function decode (input, alphabet) {
  input = input.replace(new RegExp('=', 'g'), '')
  const length = input.length

  let bits = 0
  let value = 0

  let index = 0
  const output = new Uint8Array((length * 5 / 8) | 0)

  for (let i = 0; i < length; i++) {
    value = (value << 5) | alphabet.indexOf(input[i])
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return output
}

function encode (buffer, alphabet) {
  const length = buffer.byteLength
  const view = new Uint8Array(buffer)
  const padding = alphabet.indexOf('=') === alphabet.length - 1

  if (padding) {
    alphabet = alphabet.substring(0, alphabet.length - 1)
  }

  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < length; i++) {
    value = (value << 8) | view[i]
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  if (padding) {
    while ((output.length % 8) !== 0) {
      output += '='
    }
  }

  return output
}

const create = alphabet => {
  return {
    encode: input => encode(input, alphabet),
    decode (input) {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error('invalid base32 character')
        }
      }

      return decode(input, alphabet)
    }
  }
}

export default [
  { prefix: 'b', name: 'base32', ...create('abcdefghijklmnopqrstuvwxyz234567') },
  { prefix: 'c', name: 'base32pad', ...create('abcdefghijklmnopqrstuvwxyz234567=') },
  { prefix: 'v', name: 'base32hex', ...create('0123456789abcdefghijklmnopqrstuv') },
  { prefix: 't', name: 'base32hexpad', ...create('0123456789abcdefghijklmnopqrstuv=') },
  { prefix: 'h', name: 'base32z', ...create('ybndrfg8ejkmcpqxot1uwisza345h769') }
]
