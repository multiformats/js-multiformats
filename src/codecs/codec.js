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
 * @returns {import('./interface').BlockCodec<Code, T>}
 */
export const codec = ({ name, code, decode, encode }) => {
  const decoder = new Decoder(name, code, decode)
  const encoder = new Encoder(name, code, encode)

  return { name, code, decode, encode, decoder, encoder }
}

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
