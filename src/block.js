// @ts-check

import { createV1 } from './cid.js'

/**
 * @class
 * @template T
 */
class BlockEncoder {
  /**
   * @param {Encoder<T>} codec
   * @param {BlockConfig} config
   */
  constructor (codec, config) {
    this.codec = codec
    this.config = config
  }

  /**
   * @param {T} data
   * @param {BlockConfig} [options]
   * @returns {Block}
   */
  encode (data, options) {
    const { codec } = this
    const bytes = codec.encode(data)
    return new Block(null, codec.code, data, bytes, { ...this.config, ...options })
  }
}

/**
 * @class
 * @template T
 */
class BlockDecoder {
  /**
   * @param {Decoder<T>} codec
   * @param {BlockConfig} config
   */
  constructor (codec, config) {
    this.codec = codec
    this.config = config
  }

  /**
   * @param {Uint8Array} bytes
   * @param {BlockConfig} [options]
   * @returns {Block}
   */
  decode (bytes, options) {
    const data = this.codec.decode(bytes)
    return new Block(null, this.codec.code, data, bytes, { ...this.config, ...options })
  }
}

/**
 * @template T
 * @class
 */
export class Block {
  /**
   * @param {CID|null} cid
   * @param {number} code
   * @param {T} data
   * @param {Uint8Array} bytes
   * @param {BlockConfig} config
   */
  constructor (cid, code, data, bytes, { hasher, base, base58btc }) {
    /** @type {CID|Promise<CID>|null} */
    this._cid = cid
    this.code = code
    this.data = data
    this.bytes = bytes
    this.hasher = hasher
    this.base = base
    this.base58btc = base58btc
  }

  async cid () {
    const { _cid: cid } = this
    if (cid != null) {
      return await cid
    } else {
      const { bytes, code, hasher } = this
      // First we store promise to avoid a race condition if cid is called
      // whlie promise is pending.
      const promise = createCID(hasher, bytes, code, this)
      this._cid = promise
      const cid = await promise
      // Once promise resolves we store an actual CID.
      this._cid = cid
      return cid
    }
  }
}

/**
 *
 * @param {Hasher} hasher
 * @param {Uint8Array} bytes
 * @param {number} code
 * @param {BlockConfig} context
 */

const createCID = async (hasher, bytes, code, context) => {
  const multihash = await hasher.digest(bytes)
  return createV1(code, multihash, context)
}

/**
 * @template T
 */
class BlockCodec {
  /**
   * @param {Encoder<T>} encoder
   * @param {Decoder<T>} decoder
   * @param {BlockConfig} config
   */

  constructor (encoder, decoder, config) {
    this.encoder = new BlockEncoder(encoder, config)
    this.decoder = new BlockDecoder(decoder, config)
    this.config = config
  }

  /**
   * @param {Uint8Array} bytes
   * @param {BlockConfig} [options]
   * @returns {Block<T>}
   */
  decode (bytes, options) {
    return this.decoder.decode(bytes, { ...this.config, ...options })
  }

  /**
   * @param {T} data
   * @param {BlockConfig} [options]
   * @returns {Block<T>}
   */
  encode (data, options) {
    return this.encoder.encode(data, { ...this.config, ...options })
  }
}

/**
 * @typedef {Object} Config
 * @property {MultibaseCodec<any>} base
 * @property {MultibaseCodec<'z'>} base58btc
 */

class BlockAPI {
  /**
   * @param {BlockConfig} config
   */
  constructor (config) {
    this.config = config
    this.Block = Block
  }

  /**
   * @template T
   * @param {Encoder<T>} options
   * @param {Partial<BlockConfig>} [options]
   */
  encoder (codec, options) {
    return new BlockEncoder(codec, { ...this.config, ...options })
  }

  /**
   * @template T
   * @param {Decoder<T>} options
   * @param {Partial<BlockConfig>} [options]
   */
  decoder (codec, options) {
    return new BlockDecoder(codec, { ...this.config, ...options })
  }

  /**
   * @template T
   * @param {Object} codec
   * @param {Encoder<T>} codec.encoder
   * @param {Decoder<T>} codec.decoder
   * @param {Partial<BlockConfig>} [options]
   * @returns {BlockCodec<T>}
   */

  codec ({ encoder, decoder }, options) {
    return new BlockCodec(encoder, decoder, { ...this.config, ...options })
  }
}

/**
 * @param {BlockConfig} config
 */
export const configure = (config) => new BlockAPI(config)

export default configure

/**
 * @typedef {import('./cid').CID} CID
 * @typedef {import('./block/interface').Config} BlockConfig
 * @typedef {import('./hashes/interface').MultihashHasher} Hasher
 **/

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
 * @template T
 * @typedef {import('./codecs/interface').BlockEncoder<T>} Encoder
 */

/**
 * @template T
 * @typedef {import('./codecs/interface').BlockDecoder} Decoder
 */

/**
 * @template T
 * @typedef {import('./codecs/interface').BlockCodec} Codec
 */
