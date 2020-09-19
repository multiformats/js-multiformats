// @ts-check

/**
 * @template {number} Code
 * @template T
 * @implements {MultiblockEncoder<Code, T>}
 */
export class Encoder {
  /**
   * @template {number} LeftCode
   * @template {number} RightCode
   * @template T
   * @param {BlockEncoder<LeftCode, T>|MultiblockEncoder<LeftCode, T>} left
   * @param {BlockEncoder<RightCode, T>|MultiblockEncoder<RightCode, T>} right
   * @returns {Encoder<LeftCode|RightCode, T>}
   */
  static or (left, right) {
    return new Encoder({
      ...left.codecs || { [left.code]: left },
      ...right.codecs || { [right.code]: right }
    })
  }

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
   * @param {BlockEncoder<OtherCode, T>|MultiblockEncoder<OtherCode, T>} other
   * @returns {Encoder<Code|OtherCode, T>}
   */
  or (other) {
    return Encoder.or(this, other)
  }
}

/**
 * @template {number} Code
 * @template T
 * @implements {MultiblockDecoder<Code, T>}
 */
export class Decoder {
  /**
   * @template {number} LeftCode
   * @template {number} RightCode
   * @template T
   * @param {BlockDecoder<LeftCode, T>|MultiblockDecoder<LeftCode, T>} left
   * @param {BlockDecoder<RightCode, T>|MultiblockDecoder<RightCode, T>} right
   * @returns {Decoder<LeftCode|RightCode, T>}
   */
  static or (left, right) {
    return new Decoder({
      ...left.codecs || { [left.code]: left },
      ...right.codecs || { [right.code]: right }
    })
  }

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
   * @param {BlockDecoder<OtherCode, T>|MultiblockDecoder<OtherCode, T>} other
   */
  or (other) {
    return Decoder.or(this, other)
  }
}

/**
 * @template {number} Code
 * @template T
 * @implements {MultiblockCodec<Code, T>}
 */
export class Codec {
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
   * @param {BlockCodec<OtherCode, T>|MultiblockCodec<OtherCode, T>} other
   * @returns {Codec<Code|OtherCode, T>}
   */
  or (other) {
    return Codec.or(this, other)
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
 * @typedef {import('./interface').ByteView<T>}
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockEncoder<Code, T>} BlockEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockDecoder<Code, T>} BlockDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockEncoder<Code, T>} MultiblockEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockDecoder<Code, T>} MultiblockDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockCodec<Code, T>} MultiblockCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').Multiblock<Code, T>} Multiblock
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').MultiblockView<Code, T>} MultiblockView
 */
