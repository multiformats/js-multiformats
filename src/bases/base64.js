// @ts-check

import { withSettings } from './base.js'

/**
 * The alphabet is only used to know:
 * 1. If padding is enabled (must contain '=')
 * 2. If the output must be url-safe (must contain '-' and '_')
 * 3. If the input of the output function is valid
 * The alphabets from RFC 4648 are always used.
 * @typedef {Object} Settings
 * @property {boolean} padding
 * @property {boolean} url
 * @property {string} alphabet
 *
 * @param {string} alphabet
 * @returns {Settings}
 */
const alphabetSettings = (alphabet) => ({
  alphabet,
  padding: alphabet.indexOf('=') > -1,
  url: alphabet.indexOf('-') > -1 && alphabet.indexOf('_') > -1
})

/**
 * @param {Object} b64
 * @param {(text:string) => Uint8Array} b64.decode
 * @param {(bytes:Uint8Array) => string} b64.encode
 * @param {boolean} b64.__browser
 */
export default b64 => {
  /**
   * @param {Uint8Array} input
   * @param {Settings} settings
   */
  const encode = (input, { url, padding }) => {
    let output = b64.encode(input)

    if (url) {
      output = output.replace(/\+/g, '-').replace(/\//g, '_')
    }

    const pad = output.indexOf('=')
    if (pad > 0 && !padding) {
      output = output.substring(0, pad)
    }

    return output
  }

  /**
   * @param {string} input
   * @param {Settings} settings
   */
  const decode = (input, { alphabet }) => {
    for (const char of input) {
      if (alphabet.indexOf(char) < 0) {
        throw new Error('invalid base64 character')
      }
    }

    return b64.decode(input)
  }

  /**
   * @template {string} Base
   * @template {string} Prefix
   * @param {Object} options
   * @param {Base} options.name
   * @param {Prefix} options.prefix
   * @param {string} options.alphabet
   */
  const codec = ({ name, prefix, alphabet }) => withSettings({
    name,
    prefix,
    settings: alphabetSettings(alphabet),
    decode,
    encode
  })

  return {
    b64,
    __browser: b64.__browser,
    base64: codec({
      name: 'base64',
      prefix: 'm',
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    }),
    base64pad: codec({
      name: 'base64pad',
      prefix: 'M',
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    }),
    base64url: codec({
      name: 'base64url',
      prefix: 'u',
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    }),
    base64urlpad: codec({
      name: 'base64urlpad',
      prefix: 'U',
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_='
    })
  }
}
