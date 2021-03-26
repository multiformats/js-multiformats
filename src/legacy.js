import OldCID from 'cids'
import * as bytes from './bytes.js'
import { Buffer } from 'buffer'
import { CID } from './cid.js'

/**
 * @template {number} Code
 * @template T
 * @param {BlockCodec<Code, T>} codec
 * @param {Object} options
 * @param {Object<string, MultihashHasher>} options.hashes
 */

export const legacy = (codec, { hashes }) => {
  /**
   * @param {*} obj
   */
  const toLegacy = obj => {
    if (OldCID.isCID(obj)) {
      return obj
    }

    const newCID = CID.asCID(obj)
    if (newCID) {
      const { version, code, multihash: { bytes } } = newCID
      const { buffer, byteOffset, byteLength } = bytes
      const multihash = Buffer.from(buffer, byteOffset, byteLength)
      return new OldCID(version, code, multihash)
    }

    if (bytes.isBinary(obj)) {
      // @ts-ignore
      return Buffer.from(obj)
    }

    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        obj[key] = toLegacy(value)
      }
    }

    return obj
  }

  /**
   * @param {*} obj
   */
  const fromLegacy = obj => {
    const cid = CID.asCID(obj)
    if (cid) return cid
    if (bytes.isBinary(obj)) return bytes.coerce(obj)
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        obj[key] = fromLegacy(value)
      }
    }
    return obj
  }

  /**
   * @param {T} o
   * @returns {Buffer}
   */
  const serialize = o => Buffer.from(codec.encode(fromLegacy(o)))

  /**
   * @param {Uint8Array} b
   * @returns {T}
   */
  const deserialize = b => toLegacy(codec.decode(bytes.coerce(b)))

  /**
   *
   * @param {Buffer} buff
   * @param {Object} [opts]
   * @param {0|1} [opts.cidVersion]
   * @param {string} [opts.hashAlg]
   */
  const cid = async (buff, opts) => {
    /** @type {{cidVersion:1, hashAlg: string}} */
    const defaults = { cidVersion: 1, hashAlg: 'sha2-256' }
    const { cidVersion, hashAlg } = { ...defaults, ...opts }
    const hasher = hashes[hashAlg]
    if (hasher == null) {
      throw new Error(`Hasher for ${hashAlg} was not provided in the configuration`)
    }

    const hash = await hasher.digest(buff)
    // https://github.com/bcoe/c8/issues/135
    /* c8 ignore next */
    return new OldCID(cidVersion, codec.name, Buffer.from(hash.bytes))
  }

  /**
   * @param {Buffer} buff
   * @param {string} path
   */
  const resolve = (buff, path) => {
    let value = codec.decode(buff)
    const entries = path.split('/').filter(x => x)
    while (entries.length) {
      // @ts-ignore
      value = value[/** @type {string} */(entries.shift())]
      if (typeof value === 'undefined') throw new Error('Not found')
      if (OldCID.isCID(value)) {
        return { value, remainderPath: entries.join('/') }
      }
    }
    return { value, remainderPath: '' }
  }

  /**
   *
   * @param {T} value
   * @param {string[]} [path]
   * @returns {Iterable<string>}
   */
  const _tree = function * (value, path = []) {
    if (typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        yield ['', ...path, key].join('/')
        if (typeof val === 'object' && !Buffer.isBuffer(val) && !OldCID.isCID(val)) {
          yield * _tree(val, [...path, key])
        }
      }
    }
  }

  /**
   * @param {Uint8Array} buff
   */
  const tree = (buff) => {
    return _tree(codec.decode(buff))
  }

  const defaultHashAlg = 'sha2-256'
  const util = { serialize, deserialize, cid }
  const resolver = { resolve, tree }
  return { defaultHashAlg, codec: codec.code, util, resolver }
}

/**
 * @typedef {import('./hashes/interface').MultihashHasher} MultihashHasher
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./codecs/interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @template T
 * @typedef {import('./bases/base').MultibaseCodec<T>} MultibaseCodec
 */
