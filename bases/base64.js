import * as b64 from 'multiformats/bases/_base64.js'

const create = alphabet => {
  // The alphabet is only used to know:
  //   1. If padding is enabled (must contain '=')
  //   2. If the output must be url-safe (must contain '-' and '_')
  //   3. If the input of the output function is valid
  // The alphabets from RFC 4648 are always used.
  const padding = alphabet.indexOf('=') > -1
  const url = alphabet.indexOf('-') > -1 && alphabet.indexOf('_') > -1

  return {
    encode (input) {
      let output = b64.encode(input)

      if (url) {
        output = output.replace(/\+/g, '-').replace(/\//g, '_')
      }

      const pad = output.indexOf('=')
      if (pad > 0 && !padding) {
        output = output.substring(0, pad)
      }

      return output
    },
    decode (input) {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error('invalid base64 character')
        }
      }

      return b64.decode(input)
    }
  }
}

const base64 = create('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')
const base64pad = create('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
const base64url = create('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')
const base64urlpad = create('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=')

export default [
  { prefix: 'm', name: 'base64', ...base64 },
  { prefix: 'M', name: 'base64pad', ...base64pad },
  { prefix: 'u', name: 'base64url', ...base64url },
  { prefix: 'U', name: 'base64urlpad', ...base64urlpad }
]
