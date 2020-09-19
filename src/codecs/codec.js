// @ts-check

import { Encoder as MEncoder, Decoder as MDecoder, Codec as MCodec } from './multicodec.js'

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
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockEncoder<Code, T>} MultiblockEncoder
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

  /**
   * @template {number} OtherCode
   * @param {BlockEncoder<OtherCode, T>|MultiblockEncoder<OtherCode, T>} codec
   * @returns {MEncoder<Code|OtherCode, T>}
   */
  or (codec) {
    return MEncoder.or(this, codec)
  }
}

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockDecoder<Code, T>} BlockDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockDecoder<Code, T>} MultiblockDecoder
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

  /**
   * @template {number} OtherCode
   * @param {BlockDecoder<OtherCode, T>|MultiblockDecoder<OtherCode, T>} codec
   * @returns {MDecoder<Code|OtherCode, T>}
   */
  or (codec) {
    return MDecoder.or(this, codec)
  }
}

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockCodec<Code, T>} BlockCodec
 */
/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockCodec<Code, T>} MultiblockCodec
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

  /**
   * @template {number} OtherCode
   * @param {BlockCodec<OtherCode, T>|MultiblockCodec<OtherCode, T>} other
   * @returns {MCodec<Code|OtherCode, T>}
   */
  or (other) {
    return MCodec.or(this, other)
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
