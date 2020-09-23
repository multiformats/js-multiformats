// @ts-check

import CID from './cid.js'

/**
 * @template {number} Code
 * @template T
 * @class
 */
export default class Block {
  /**
   * @param {CID|null} cid
   * @param {Code} code
   * @param {T} data
   * @param {Uint8Array} bytes
   * @param {BlockConfig} config
   */
  constructor (cid, code, data, bytes, { hasher }) {
    /** @type {CID|Promise<CID>|null} */
    this._cid = cid
    this.code = code
    this.data = data
    this.bytes = bytes
    this.hasher = hasher
  }

  async cid () {
    const { _cid: cid } = this
    if (cid != null) {
      return await cid
    } else {
      const { bytes, code, hasher } = this
      // First we store promise to avoid a race condition if cid is called
      // whlie promise is pending.
      const promise = createCID(hasher, bytes, code)
      this._cid = promise
      const cid = await promise
      // Once promise resolves we store an actual CID.
      this._cid = cid
      return cid
    }
  }

  links () {
    return links(this.data, [])
  }

  tree () {
    return tree(this.data, [])
  }

  /**
   * @param {string} path
   */
  get (path) {
    return get(this.data, path.split('/').filter(Boolean))
  }

  /**
   * @template {number} Code
   * @template T
   * @param {Encoder<Code, T>} codec
   * @param {BlockConfig} options
   */
  static encoder (codec, options) {
    return new BlockEncoder(codec, options)
  }

  /**
   * @template {number} Code
   * @template T
   * @param {Decoder<Code, T>} codec
   * @param {BlockConfig} options
   */
  static decoder (codec, options) {
    return new BlockDecoder(codec, options)
  }

  /**
   * @template {number} Code
   * @template T
   * @param {Object} codec
   * @param {Encoder<Code, T>} codec.encoder
   * @param {Decoder<Code, T>} codec.decoder
   * @param {BlockConfig} options
   * @returns {BlockCodec<Code, T>}
   */

  static codec ({ encoder, decoder }, options) {
    return new BlockCodec(encoder, decoder, options)
  }
}

/**
 * @template T
 * @param {T} source
 * @param {Array<string|number>} base
 * @returns {Iterable<[string, CID]>}
 */
const links = function * (source, base) {
  for (const [key, value] of Object.entries(source)) {
    const path = [...base, key]
    if (value != null && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const [index, element] of value.entries()) {
          const elementPath = [...path, index]
          const cid = CID.asCID(element)
          if (cid) {
            yield [elementPath.join('/'), cid]
          } else if (typeof element === 'object') {
            yield * links(element, elementPath)
          }
        }
      } else {
        const cid = CID.asCID(value)
        if (cid) {
          yield [path.join('/'), cid]
        } else {
          yield * links(value, path)
        }
      }
    }
  }
}

/**
 * @template T
 * @param {T} source
 * @param {Array<string|number>} base
 * @returns {Iterable<string>}
 */
const tree = function * (source, base) {
  for (const [key, value] of Object.entries(source)) {
    const path = [...base, key]
    yield path.join('/')
    if (value != null && typeof value === 'object' && !CID.asCID(value)) {
      if (Array.isArray(value)) {
        for (const [index, element] of value.entries()) {
          const elementPath = [...path, index]
          yield elementPath.join('/')
          if (typeof element === 'object' && !CID.asCID(element)) {
            yield * tree(element, elementPath)
          }
        }
      } else {
        yield * tree(value, path)
      }
    }
  }
}

/**
 * @template T
 * @param {T} source
 * @param {string[]} path
 */
const get = (source, path) => {
  let node = source
  for (const [index, key] of path.entries()) {
    node = node[key]
    if (node == null) {
      throw new Error(`Object has no property at ${path.slice(0, index - 1).map(part => `[${JSON.stringify(part)}]`).join('')}`)
    }
    const cid = CID.asCID(node)
    if (cid) {
      return { value: cid, remaining: path.slice(index).join('/') }
    }
  }
  return { value: node }
}

/**
 *
 * @param {Hasher} hasher
 * @param {Uint8Array} bytes
 * @param {number} code
 */

const createCID = async (hasher, bytes, code) => {
  const multihash = await hasher.digest(bytes)
  return CID.createV1(code, multihash)
}

/**
 * @template {number} Code
 * @template T
 */
class BlockCodec {
  /**
   * @param {Encoder<Code, T>} encoder
   * @param {Decoder<Code, T>} decoder
   * @param {BlockConfig} config
   */

  constructor (encoder, decoder, config) {
    this.encoder = new BlockEncoder(encoder, config)
    this.decoder = new BlockDecoder(decoder, config)
    this.config = config
  }

  /**
   * @param {Uint8Array} bytes
   * @param {Partial<BlockConfig>} [options]
   * @returns {Block<Code, T>}
   */
  decode (bytes, options) {
    return this.decoder.decode(bytes, { ...this.config, ...options })
  }

  /**
   * @param {T} data
   * @param {Partial<BlockConfig>} [options]
   * @returns {Block<Code, T>}
   */
  encode (data, options) {
    return this.encoder.encode(data, { ...this.config, ...options })
  }
}

/**
 * @class
 * @template {number} Code
 * @template T
 */
class BlockEncoder {
  /**
   * @param {Encoder<Code, T>} codec
   * @param {BlockConfig} config
   */
  constructor (codec, config) {
    this.codec = codec
    this.config = config
  }

  /**
   * @param {T} data
   * @param {Partial<BlockConfig>} [options]
   * @returns {Block<Code, T>}
   */
  encode (data, options) {
    const { codec } = this
    const bytes = codec.encode(data)
    return new Block(null, codec.code, data, bytes, { ...this.config, ...options })
  }
}

/**
 * @class
 * @template {number} Code
 * @template T
 */
class BlockDecoder {
  /**
   * @param {Decoder<Code, T>} codec
   * @param {BlockConfig} config
   */
  constructor (codec, config) {
    this.codec = codec
    this.config = config
  }

  /**
   * @param {Uint8Array} bytes
   * @param {Partial<BlockConfig>} [options]
   * @returns {Block<Code, T>}
   */
  decode (bytes, options) {
    const data = this.codec.decode(bytes)
    return new Block(null, this.codec.code, data, bytes, { ...this.config, ...options })
  }
}
/**
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
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockEncoder<Code, T>} Encoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockDecoder<Code, T>} Decoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockCodec<Code, T>} Codec
 */
