// @ts-check

/**
 * @typedef {import('./interface').BaseEncoder} BaseEncoder
 * @typedef {import('./interface').BaseDecoder} BaseDecoder
 * @typedef {import('./interface').BaseCodec} BaseCodec
 */

/**
 * @template T
 * @typedef {import('./interface').Multibase<T>} Multibase
 */
/**
 * @template T
 * @typedef {import('./interface').MultibaseEncoder<T>} MultibaseEncoder
 */

/**
 * Class represents both BaseEncoder and MultibaseEncoder meaning it
 * can be used to encode to multibase or base encode without multibase
 * prefix.
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseEncoder<Prefix>}
 * @implements {BaseEncoder}
 */
class Encoder {
  /**
   * @param {Base} name
   * @param {Prefix} prefix
   * @param {(bytes:Uint8Array) => string} baseEncode
   */
  constructor (name, prefix, baseEncode) {
    this.name = name
    this.prefix = prefix
    this.baseEncode = baseEncode
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {Multibase<Prefix>}
   */
  encode (bytes) {
    // @ts-ignore
    return `${this.prefix}${this.baseEncode(bytes)}`
  }
}

/**
 * @template T
 * @typedef {import('./interface').MultibaseDecoder<T>} MultibaseDecoder
 */

/**
 * Class represents both BaseDecoder and MultibaseDecoder so it could be used
 * to decode multibases (with matching prefix) or just base decode strings
 * with corresponding base encoding.
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {BaseDecoder}
 */
class Decoder {
  /**
   * @param {Base} name
   * @param {Prefix} prefix
   * @param {(text:string) => Uint8Array} baseDecode
   */
  constructor (name, prefix, baseDecode) {
    this.name = name
    this.prefix = prefix
    this.baseDecode = baseDecode
  }

  /**
   * @param {string} text
   */
  decode (text) {
    switch (text[0]) {
      case this.prefix: {
        return this.baseDecode(text.slice(1))
      }
      default: {
        throw Error(`${this.name} expects input starting with ${this.prefix} and can not decode "${text}"`)
      }
    }
  }
}

/**
 * @template T
 * @typedef {import('./interface').MultibaseCodec<T>} MultibaseCodec
 */

/**
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {MultibaseCodec<Prefix>}
 * @implements {MultibaseEncoder<Prefix>}
 * @implements {MultibaseDecoder<Prefix>}
 * @implements {BaseCodec}
 * @implements {BaseEncoder}
 * @implements {BaseDecoder}
 */
export class Codec {
  /**
   * @param {Base} name
   * @param {Prefix} prefix
   * @param {(bytes:Uint8Array) => string} baseEncode
   * @param {(text:string) => Uint8Array} baseDecode
   */
  constructor (name, prefix, baseEncode, baseDecode) {
    this.name = name
    this.prefix = prefix
    this.baseEncode = baseEncode
    this.baseDecode = baseDecode
    this.encoder = new Encoder(name, prefix, baseEncode)
    this.decoder = new Decoder(name, prefix, baseDecode)
  }

  /**
   * @param {Uint8Array} input
   */
  encode (input) {
    return this.encoder.encode(input)
  }

  decode (input) {
    return this.decoder.decode(input)
  }
}

/**
 * @template {string} Base
 * @template {string} Prefix
 * @param {Object} options
 * @param {Base} options.name
 * @param {Prefix} options.prefix
 * @param {string} options.alphabet
 * @param {(input:Uint8Array, alphabet:string) => string} options.encode
 * @param {(input:string, alphabet:string) => Uint8Array} options.decode
 */
export const withAlphabet = ({ name, prefix, encode, decode, alphabet }) =>
  from({
    name,
    prefix,
    encode: input => encode(input, alphabet),
    decode: input => {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error(`invalid ${name} character`)
        }
      }
      return decode(input, alphabet)
    }
  })

/**
 * @template {string} Base
 * @template {string} Prefix
 * @template Settings
 *
 * @param {Object} options
 * @param {Base} options.name
 * @param {Prefix} options.prefix
 * @param {Settings} options.settings
 * @param {(input:Uint8Array, settings:Settings) => string} options.encode
 * @param {(input:string, settings:Settings) => Uint8Array} options.decode
 */

export const withSettings = ({ name, prefix, settings, encode, decode }) =>
  from({
    name,
    prefix,
    encode: (input) => encode(input, settings),
    decode: (input) => decode(input, settings)
  })

/**
 * @template {string} Base
 * @template {string} Prefix
 * @param {Object} options
 * @param {Base} options.name
 * @param {Prefix} options.prefix
 * @param {(bytes:Uint8Array) => string} options.encode
 * @param {(input:string) => Uint8Array} options.decode
 * @returns {Codec<Base, Prefix>}
 */
export const from = ({ name, prefix, encode, decode }) =>
  new Codec(name, prefix, encode, decode)

export const notImplemented = ({ name, prefix }) =>
  from({
    name,
    prefix,
    encode: _ => {
      throw Error(`No ${name} encoder implementation was provided`)
    },
    decode: _ => {
      throw Error(`No ${name} decoder implemnetation was provided`)
    }
  })
