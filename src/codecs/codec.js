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
 * @class
 * @template T
 * @template {string} Name
 * @template {number} Code
 * @implements {BlockEncoder<Code, T>}
 * @implements {MulticodecEncoder<Code, T>}
 */
class Encoder {
  /**
   * @param {Name} name
   * @param {Code} code
   * @param {(data:T) => Uint8Array} encodeBlock
   */
  constructor (name, code, encodeBlock) {
    this.name = name
    this.code = code
    this.encodeBlock = encodeBlock
  }

  get codecs () {
    return { [this.code]: this }
  }

  /**
   * Encodes given input `{ code, data }` with this encoder, if `code` does not
   * match the code here it will throw an exception.
   * @param {Object} input
   * @param {Code} input.code
   * @param {T} input.value
   * @returns {BlockView<Code, T>}
   */
  encode ({ code, value }) {
    if (code === this.code) {
      return { code, bytes: this.encodeBlock(value) }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${this.code}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MulticodecEncoder<OtherCode, T>} other
   * @returns {MulticodecEncoder<Code|OtherCode, T>}
   */
  or (other) {
    // Note: Need type annotate so it isn't inferred as `BlockEncoder<Code>`.
    /** @type {BlockEncoder<Code|OtherCode, T>} */
    const defaultEncoder = this
    return new ComposedEncoder(defaultEncoder, {
      ...other.codecs,
      [this.code]: this
    })
  }
}

/**
 * @template {number} Code
 * @template T
 * @implements {BlockEncoder<Code, T>}
 * @implements {MulticodecEncoder<Code, T>}
 */
class ComposedEncoder {
  /**
   * @param {BlockEncoder<Code, T>} defaultEncoder
   * @param {Record<Code, BlockEncoder<Code, T>>} codecs
   */
  constructor (defaultEncoder, codecs) {
    this.defaultEncoder = defaultEncoder
    this.codecs = codecs
  }

  // BlockEncoder

  // Implementing `BlockEncoder` interface seems awkward because this
  // represents composition and therefor `.code` and `.encodeBlock` have little
  // sense. On the other hand making composed codec e.g. `dagCBOR.or(dagPB)`
  // be a drop-in replacment for `dagCBOR` is so convinient that we chose to
  // go for it.
  get code () {
    return this.defaultEncoder.code
  }

  get name () {
    return Object.values(this.codecs).map(codec => codec.name).join('|')
  }

  /**
   * @param {T} value
   * @returns {ByteView<T>}
   */
  encodeBlock (value) {
    return this.defaultEncoder.encodeBlock(value)
  }

  /**
   * @param {BlockSource<Code, T>} block
   * @returns {BlockView<Code, T>}
   */
  encode ({ code, value }) {
    const codec = this.codecs[code]
    if (codec) {
      const bytes = codec.encodeBlock(value)
      return { code, bytes }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${Object.keys(this.codecs)}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MulticodecEncoder<OtherCode, T>} other
   * @returns {MulticodecEncoder<Code|OtherCode, T>}
   */
  or (other) {
    // Note: Need type annotate so it isn't inferred as `BlockEncoder<Code>`.
    /** @type {BlockEncoder<Code|OtherCode, T>} */
    const encoder = this.defaultEncoder
    return new ComposedEncoder(encoder, {
      ...other.codecs,
      ...this.codecs
    })
  }
}

/**
 * @class
 * @template {number} Code
 * @template T
 * @implements {BlockDecoder<Code, T>}
 * @implements {MulticodecDecoder<Code, T>}
 */
class Decoder {
  /**
   * @param {string} name
   * @param {Code} code
   * @param {(bytes:Uint8Array) => T} decodeBlock
   */
  constructor (name, code, decodeBlock) {
    this.name = name
    this.code = code
    this.decodeBlock = decodeBlock
  }

  get codecs () {
    return { [this.code]: this }
  }

  /**
   * @param {BlockView<Code, T>} input
   * @returns {BlockSource<Code, T>}
   */
  decode ({ code, bytes }) {
    if (this.code === code) {
      return { code, value: this.decodeBlock(bytes) }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${this.code}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MulticodecDecoder<OtherCode, T>} other
   * @returns {MulticodecDecoder<Code|OtherCode, T>}
   */
  or (other) {
    // Note: Need type annotate so it isn't inferred as `BlockEncoder<Code>`.
    /** @type {BlockDecoder<Code|OtherCode, T>} */
    const defaultDecoder = this
    return new ComposedDecoder(defaultDecoder, {
      ...other.codecs,
      [this.code]: this
    })
  }
}

/**
 * @template {number} Code
 * @template T
 * @implements {BlockDecoder<Code, T>}
 * @implements {MulticodecDecoder<Code, T>}
 */
class ComposedDecoder {
  /**
   * @param {BlockDecoder<Code, T>} defaultDecoder
   * @param {Record<Code, BlockDecoder<Code, T>>} codecs
   */
  constructor (defaultDecoder, codecs) {
    this.defaultDecoder = defaultDecoder
    this.codecs = codecs
  }

  // BlockDecoder

  // Implementing `BlockDecoder` interface seems awkward because this
  // represents composition and therefor `.code` and `.decodeBlock` have little
  // sense. On the other hand making composed codec e.g. `dagCBOR.or(dagPB)`
  // be a drop-in replacment for `dagCBOR` is so convinient that we chose to
  // go for it.
  get code () {
    return this.defaultDecoder.code
  }

  /**
   * Decodes given bytes with this decoder. If it was encoded with a different
   * codec than the default it will throw an exception.
   * @param {ByteView<T>} bytes
   * @returns {T}
   */
  decodeBlock (bytes) {
    return this.defaultDecoder.decodeBlock(bytes)
  }

  // MulticodecDecoder

  /**
   * @param {BlockView<Code, T>} block
   * @returns {BlockSource<Code, T>}
   */
  decode ({ code, bytes }) {
    const codec = this.codecs[code]
    if (codec) {
      const value = codec.decodeBlock(bytes)
      return { code, value }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${Object.keys(this.codecs)}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MulticodecDecoder<OtherCode, T>} other
   * @returns {MulticodecDecoder<Code|OtherCode, T>}
   */
  or (other) {
    /** @type {BlockDecoder<Code|OtherCode, T>} */
    const defaultDecoder = this.defaultDecoder
    return new ComposedDecoder(defaultDecoder, {
      ...other.codecs,
      ...this.codecs
    })
  }
}

/**
 * @class
 * @template {string} Name
 * @template {number} Code
 * @template T
 * @implements {BlockCodec<Code, T>}
 * @implements {MulticodecCodec<Code, T>}
 */
class Codec {
  /**
   * @param {Name} name
   * @param {Code} code
   * @param {(data:T) => Uint8Array} encodeBlock
   * @param {(bytes:Uint8Array) => T} decodeBlock
   */
  constructor (name, code, encodeBlock, decodeBlock) {
    this.name = name
    this.code = code
    this.encodeBlock = encodeBlock
    this.decodeBlock = decodeBlock
  }

  get codecs () {
    return { [this.code]: this }
  }

  /**
   * Encodes given input `{ code, data }` with this encoder, if `code` does not
   * match the code here it will throw an exception.
   * @param {Object} input
   * @param {Code} input.code
   * @param {T} input.value
   * @returns {BlockView<Code, T>}
   */
  encode ({ code, value }) {
    if (code === this.code) {
      return { code, bytes: this.encodeBlock(value) }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${this.code}`)
    }
  }

  /**
   * @param {BlockView<Code, T>} input
   * @returns {BlockSource<Code, T>}
   */
  decode ({ code, bytes }) {
    if (this.code === code) {
      return { code, value: this.decodeBlock(bytes) }
    } else {
      throw Error(`Codec (code: ${code}) is not supported, only supports: ${this.code}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MulticodecCodec<OtherCode, T>} other
   * @returns {MulticodecCodec<Code|OtherCode, T>}
   */
  or (other) {
    /** @type {BlockCodec<Code|OtherCode, T>} */
    const defaultCodec = this
    return new ComposedCodec(defaultCodec, {
      ...other.codecs,
      [this.code]: this
    })
  }

  get decoder () {
    const { name, code, decodeBlock } = this
    const decoder = new Decoder(name, code, decodeBlock)
    Object.defineProperty(this, 'decoder', { value: decoder })
    return decoder
  }

  get encoder () {
    const { name, code, encodeBlock } = this
    const encoder = new Encoder(name, code, encodeBlock)
    Object.defineProperty(this, 'encoder', { value: encoder })
    return encoder
  }
}

/**
 * @class
 * @template {number} Code
 * @template T
 * @implements {BlockCodec<Code, T>}
 * @implements {MulticodecCodec<Code, T>}
 */
class ComposedCodec {
  /**
   * @param {BlockCodec<Code, T>} defaultCodec
   * @param {Record<Code, BlockCodec<Code, T>>} codecs
   */
  constructor (defaultCodec, codecs) {
    this.defaultCodec = defaultCodec
    this.codecs = codecs

    this.encoder = new ComposedEncoder(defaultCodec, codecs)
    this.decoder = new ComposedDecoder(defaultCodec, codecs)
  }

  // BlockCodec

  get name () {
    return Object.values(this.codecs).map(codec => codec.name).join('|')
  }

  get code () {
    return this.defaultCodec.code
  }

  /**
   * @param {T} value
   */
  encodeBlock (value) {
    return this.encoder.encodeBlock(value)
  }

  /**
   * @param {ByteView<T>} bytes
   */
  decodeBlock (bytes) {
    return this.decoder.decodeBlock(bytes)
  }

  // MulticodecCodec

  /**
   * Encodes given input `{ code, data }` with this encoder, if `code` does not
   * match the code here it will throw an exception.
   * @param {BlockSource<Code, T>} input
   * @returns {BlockView<Code, T>}
   */
  encode (input) {
    return this.encoder.encode(input)
  }

  /**
   * @param {BlockView<Code, T>} input
   * @returns {BlockSource<Code, T>}
   */
  decode (input) {
    return this.decoder.decode(input)
  }

  /**
   * @template {number} OtherCode
   * @param {MulticodecCodec<OtherCode, T>} other
   * @returns {MulticodecCodec<Code|OtherCode, T>}
   */
  or (other) {
    /** @type {BlockCodec<Code|OtherCode, T>} */
    const defaultCodec = this.defaultCodec

    return new ComposedCodec(defaultCodec, {
      ...this.codecs,
      ...other.codecs
    })
  }
}

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').Codec<Code, T>} MulticodecCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockEncoder<Code, T>} BlockEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').Encoder<Code, T>} MulticodecEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockDecoder<Code, T>} BlockDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').Decoder<Code, T>} MulticodecDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockView<Code, T>} BlockView
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockSource<Code, T>} BlockSource
 */

/**
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */
