// @ts-check

/**
 * @template {string} Name
 * @template {number} Code
 * @template T
 *
 * @param {Object} options
 * @param {Name} options.name
 * @param {Code} options.code
 * @param {(data:T) => Uint8Array} options.encode
 * @param {(bytes:Uint8Array) => T} options.decode
 */
export const codec = ({ name, code, decode, encode }) =>
  new Codec(name, code, encode, decode)

/**
 * @template T
 * @typedef {import('./interface').BlockEncoder<T>} BlockEncoder
 */

/**
 * @class
 * @template T
 * @template {string} Name
 * @template {number} Code
 * @implements {BlockEncoder<T>}
 */
export class Encoder {
  /**
   * @param {Name} name
   * @param {Code} code
   * @param {(data:T) => Uint8Array} encode
   */
  constructor (name, code, encode) {
    this.name = name
    this.code = code
    this.encode = encode
  }
}

/**
 * @template T
 * @typedef {import('./interface').BlockDecoder<T>} BlockDecoder
 */

/**
 * @class
 * @template T
 * @implements {BlockDecoder<T>}
 */
export class Decoder {
  /**
   * @param {(bytes:Uint8Array) => T} decode
   */
  constructor (code, decode) {
    this.code = code
    this.decode = decode
  }
}

/**
 * @template T
 * @typedef {import('./interface').BlockCodec<T>} BlockCodec
 */

/**
 * @class
 * @template {string} Name
 * @template {number} Code
 * @template T
 * @implements {BlockCodec<T>}
 */
export class Codec {
  /**
   * @param {Name} name
   * @param {Code} code
   * @param {(data:T) => Uint8Array} encode
   * @param {(bytes:Uint8Array) => T} decode
   */
  constructor (name, code, encode, decode) {
    this.name = name
    this.code = code
    this.encode = encode
    this.decode = decode
  }

  get decoder () {
    const { name, decode } = this
    const decoder = new Decoder(name, decode)
    Object.defineProperty(this, 'decoder', { value: decoder })
    return decoder
  }

  get encoder () {
    const { name, code, encode } = this
    const encoder = new Encoder(name, code, encode)
    Object.defineProperty(this, 'encoder', { value: encoder })
    return encoder
  }
}
