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
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockEncoder<Code, T>} BlockEncoder
 */

/**
 * @class
 * @template T
 * @template {string} Name
 * @template {number} Code
 * @implements {BlockEncoder<Code, T>}
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
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockDecoder<Code, T>} BlockDecoder
 */

/**
 * @class
 * @template {number} Code
 * @template T
 * @implements {BlockDecoder<Code, T>}
 */
export class Decoder {
  /**
   * @param {string} name
   * @param {Code} code
   * @param {(bytes:Uint8Array) => T} decode
   */
  constructor (name, code, decode) {
    this.name = name
    this.code = code
    this.decode = decode
  }
}

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @class
 * @template {string} Name
 * @template {number} Code
 * @template T
 * @implements {BlockCodec<Code, T>}
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
    const { name, code, decode } = this
    const decoder = new Decoder(name, code, decode)
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
