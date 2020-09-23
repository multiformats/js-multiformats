// @ts-check

import Block from './dag/block.js'

/**
 * @template {number} Code
 * @template {number} HashAlgorithm
 * @template T
 * @param {Object} options
 * @param {MulticodecCodec<Code, T> & BlockCodec<Code, T>} options.multicodec
 * @param {MultihashHasher<HashAlgorithm>} options.hasher
 * @returns {Codec<Code, HashAlgorithm, T>}
 */
export const codec = ({ multicodec, hasher }) =>
  new Codec(multicodec, hasher)

/**
 * @template {number} Code
 * @template {number} HashAlgorithm
 * @template T
 * @param {Object} options
 * @param {MulticodecEncoder<Code, T> & BlockEncoder<Code, T>} options.multicodec
 * @param {MultihashHasher<HashAlgorithm>} options.hasher
 * @returns {Encoder<Code, HashAlgorithm, T>}
 */
export const encoder = ({ multicodec, hasher }) =>
  new Encoder(multicodec, hasher)

/**
 * @template {number} Code
 * @template {number} HashAlgorithm
 * @template T
 * @param {Object} options
 * @param {MulticodecDecoder<Code, T> & BlockDecoder<Code, T>} options.multicodec
 * @param {MultihashHasher<HashAlgorithm>} options.hasher
 * @returns {Decoder<Code, HashAlgorithm, T>}
 */
export const decoder = ({ multicodec, hasher }) =>
  new Decoder(multicodec, hasher)

/**
 * @class
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @implements {DagEncoder<Code, Algorithm, T>}
 */
class Encoder {
  /**
   * @param {MulticodecEncoder<Code, T> & BlockEncoder<Code, T>} encoder
   * @param {MultihashHasher<Algorithm>} hasher
   */
  constructor (encoder, hasher) {
    this.codec = encoder
    this.hasher = hasher
  }

  /**
   * @param {T} value
   * @returns {BlockObject<T>}
   */
  encodeBlock (value) {
    const bytes = this.codec.encodeBlock(value)
    return Block.createWithHasher(value, bytes, this.codec.code, this.hasher)
  }

  /**
   * @param {BlockDraft<Code, Algorithm, T>} input
   * @returns {BlockObject<T>}
   */
  encode (input) {
    const { bytes, code } = this.codec.encode(input)
    return Block.createWithHasher(input.value, bytes, code, this.hasher)
  }
}

/**
 * @class
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @implements {DagDecoder<Code, Algorithm, T>}
 */
class Decoder {
  /**
   * @param {MulticodecDecoder<Code, T> & BlockDecoder<Code, T>} decoder
   * @param {MultihashHasher<Algorithm>} hasher
   */
  constructor (decoder, hasher) {
    this.codec = decoder
    this.hasher = hasher
  }

  /**
   * @param {ByteView<T>} bytes
   * @returns {BlockObject<T>}
   */
  decodecBlock (bytes) {
    const value = this.codec.decodeBlock(bytes)
    return Block.createWithHasher(value, bytes, this.codec.code, this.hasher)
  }

  /**
   * @param {BlockView<Code, Algorithm, T>} input
   * @returns {BlockObject<T>}
   */
  decode (input) {
    if (input.cid) {
      const { cid, bytes } = input
      /** @type {Code} */
      const code = (cid.code)
      const { value } = this.codec.decode({ code, bytes })

      return Block.createWithCID(cid, value, bytes)
    } else {
      const { code, value } = this.codec.decode(input)
      return Block.createWithHasher(value, input.bytes, code, this.hasher)
    }
  }
}

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @class
 * @implements {DagCodec<Code, Algorithm, T>}
 */
class Codec {
  /**
   * @param {MulticodecCodec<Code, T> & BlockCodec<Code, T>} codec
   * @param {MultihashHasher<Algorithm>} hasher
   */
  constructor (codec, hasher) {
    this.codec = codec
    this.hasher = hasher

    this.encoder = new Encoder(codec, hasher)
    this.decoder = new Decoder(codec, hasher)
  }

  encode (input) {
    return this.encoder.encode(input)
  }

  encodeBlock (value) {
    return this.encoder.encodeBlock(value)
  }

  decode (input) {
    return this.decoder.decode(input)
  }

  decodeBlock (bytes) {
    return this.decoder.decodecBlock(bytes)
  }
}

/**
 * @template T
 * @typedef {import('./dag/interface').ByteView<T>} ByteView
 */

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @typedef {import('./dag/interface').BlockView<Code, Algorithm, T>} BlockView
 */

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @typedef {import('./dag/interface').BlockDraft<Code, Algorithm, T>} BlockDraft
 */

/**
 * @template T
 * @typedef {import('./dag/interface').Block<T>} BlockObject
 */

/**
 * @template {number} Code
 * @typedef {import('./hashes/interface').MultihashHasher<Code>} MultihashHasher
 **/

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @typedef {import('./dag/interface').DagCodec<Code, Algorithm, T>} DagCodec
 */

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @typedef {import('./dag/interface').DagEncoder<Code, Algorithm, T>} DagEncoder
 */

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @typedef {import('./dag/interface').DagDecoder<Code, Algorithm, T>} DagDecoder
 */

/**
 * @template T
 * @typedef {import('./bases/interface').MultibaseEncoder<T>} MultibaseEncoder
 */

/**
 * @template T
 * @typedef {import('./bases/interface').MultibaseDecoder<T>} MultibaseDecoder
 */

/**
 * @template T
 * @typedef {import('./bases/interface').MultibaseCodec<T>} MultibaseCodec
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').Encoder<Code, T>} MulticodecEncoder
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
 * @typedef {import('./codecs/interface').Decoder<Code, T>} MulticodecDecoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').Codec<Code, T>} MulticodecCodec
 */
