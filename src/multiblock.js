// @ts-check

/**
 * @template {number} Code
 * @template T
 * @implements {MultiblockEncoder<Code, T>}
 */
class Encoder {
  /**
   * @param {Record<Code, BlockEncoder<Code, T>>} codecs
   */
  constructor (codecs) {
    this.codecs = codecs
  }

  /**
   * @param {Multiblock<Code, T>} block
   * @returns {MultiblockView<Code, T>}
   */
  encode ({ code, data }) {
    const codec = this.codecs[code]
    if (codec) {
      const bytes = codec.encode(data)
      return { code, block: bytes }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${Object.keys(this.codecs)}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @template T
   * @param {BlockEncoder<OtherCode, T>|MultiblockEncoder<OtherCode, T>} other
   * @returns {Encoder<Code|OtherCode, T>}
   */
  or (other) {
    return new Encoder({
      ...this.codecs,
      ...other.codecs || { [other.code]: other }
    })
  }
}

/**
 * @template {number} Code
 * @template T
 * @implements {MultiblockDecoder<Code, T>}
 */
class Decoder {
  /**
   * @param {Record<Code, BlockDecoder<Code, T>>} codecs
   */
  constructor (codecs) {
    this.codecs = codecs
  }

  /**
   * @param {MultiblockView<Code, T>} block
   * @returns {Multiblock<Code, T>}
   */
  decode ({ code, block }) {
    const codec = this.codecs[code]
    if (codec) {
      const data = codec.decode(block)
      return { code, data }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${Object.keys(this.codecs)}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @template T
   * @param {BlockEncoder<OtherCode, T>|MultiblockEncoder<OtherCode, T>} other
   * @returns {Encoder<Code|OtherCode, T>}
   */
  or (other) {
    return new Encoder({
      ...this.codecs,
      ...other.codecs || { [other.code]: other }
    })
  }
}

/**
 * @template {number} Code
 * @template T
 * @implements {MultiblockCodec<Code, T>}
 */
export default class Codec {
  /**
   * @template {number} Code
   * @template T
   * @param {BlockCodec<Code, T>|MultiblockCodec<Code, T>} codec
   * @returns {Codec<Code, T>}
   */
  static codec (codec) {
    return new Codec(codec.codecs || { [codec.code]: codec })
  }

  /**
   * @template {number} Code
   * @template T
   * @param {BlockDecoder<Code, T>|MultiblockDecoder<Code, T>} codec
   * @returns {Decoder<Code, T>}
   */
  static decoder (codec) {
    return new Decoder(codec.codecs || { [codec.code]: codec })
  }

  /**
   * @template {number} Code
   * @template T
   * @param {BlockEncoder<Code, T>|MultiblockEncoder<Code, T>} codec
   * @returns {Encoder<Code, T>}
   */
  static encoder (codec) {
    return new Encoder(codec.codecs || { [codec.code]: codec })
  }

  /**
   * @template {number} LeftCode
   * @template {number} RightCode
   * @template T
   * @param {BlockCodec<LeftCode, T>|MultiblockCodec<LeftCode, T>} left
   * @param {BlockCodec<RightCode, T>|MultiblockCodec<RightCode, T>} right
   * @returns {Codec<LeftCode|RightCode, T>}
   */
  static or (left, right) {
    return new Codec({
      ...left.codecs || { [left.code]: left },
      ...right.codecs || { [right.code]: right }
    })
  }

  /**
   * @param {Record<Code, BlockCodec<Code, T>>} codecs
   */
  constructor (codecs) {
    this.codecs = codecs
  }

  /**
   * @param {MultiblockView<Code, T>} block
   * @returns {Multiblock<Code, T>}
   */
  decode ({ code, block }) {
    const codec = this.codecs[code]
    if (codec) {
      const data = codec.decode(block)
      return { code, data }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${Object.keys(this.codecs)}`)
    }
  }

  /**
   * @param {Multiblock<Code, T>} block
   * @returns {MultiblockView<Code, T>}
   */
  encode ({ code, data }) {
    const codec = this.codecs[code]
    if (codec) {
      const bytes = codec.encode(data)
      return { code, block: bytes }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${Object.keys(this.codecs)}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @template T
   * @param {BlockEncoder<OtherCode, T>|MultiblockEncoder<OtherCode, T>} other
   * @returns {Encoder<Code|OtherCode, T>}
   */
  or (other) {
    return new Encoder({
      ...this.codecs,
      ...other.codecs || { [other.code]: other }
    })
  }

  /**
   * @type {Encoder<Code, T>}
   */
  get encoder () {
    const encoder = new Encoder(this.codecs)
    Object.defineProperty(this, 'encoder', { value: encoder })
    return encoder
  }

  /**
   * @type {Decoder<Code, T>}
   */
  get decoder () {
    const decoder = new Decoder(this.codecs)
    Object.defineProperty(this, 'decoder', { value: decoder })
    return decoder
  }
}

/**
 * @template T
 * @typedef {import('./codecs/interface').ByteView<T>}
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockEncoder<Code, T>} BlockEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockDecoder<Code, T>} BlockDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').MultiblockEncoder<Code, T>} MultiblockEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').MultiblockDecoder<Code, T>} MultiblockDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').MultiblockCodec<Code, T>} MultiblockCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').Multiblock<Code, T>} Multiblock
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').MultiblockView<Code, T>} MultiblockView
 */
