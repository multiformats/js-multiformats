// @ts-check

import CID from '../cid.js'

/**
 * @template T
 */
export default class Block {
  /**
   * @param {T} value
   * @param {ByteView<T>} bytes
   */
  constructor (value, bytes) {
    this.value = value
    this.bytes = bytes
    this.value = value
  }

  toData () {
    return this.value
  }

  toBytes () {
    return this.bytes
  }

  links () {
    return Block.links(this.value, [])
  }

  tree () {
    return Block.tree(this.value, [])
  }

  /**
     * @param {string} path
     */
  get (path) {
    return Block.get(this.value, path.split('/').filter(Boolean))
  }

  /**
   * @template T
   * @param {CID} cid
   * @param {T} value
   * @param {ByteView<T>} bytes
   */
  static createWithCID (cid, value, bytes) {
    return new BlockWithCID(cid, value, bytes)
  }

  /**
   * @template {number} Code
   * @template {number} Algorithm
   * @template T
   * @param {T} value
   * @param {ByteView<T>} bytes
   * @param {Code} code
   * @param {MultihashHasher<Algorithm>} hasher
   */
  static createWithHasher (value, bytes, code, hasher) {
    return new BlockWithHasher(value, bytes, code, hasher)
  }

  /**
 * @template T
 * @param {T} source
 * @param {Array<string|number>} base
 * @returns {Iterable<[string, CID]>}
 */
  static * links (source, base) {
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
              yield * Block.links(element, elementPath)
            }
          }
        } else {
          const cid = CID.asCID(value)
          if (cid) {
            yield [path.join('/'), cid]
          } else {
            yield * Block.links(value, path)
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
  static * tree (source, base) {
    for (const [key, value] of Object.entries(source)) {
      const path = [...base, key]
      yield path.join('/')
      if (value != null && typeof value === 'object' && !CID.asCID(value)) {
        if (Array.isArray(value)) {
          for (const [index, element] of value.entries()) {
            const elementPath = [...path, index]
            yield elementPath.join('/')
            if (typeof element === 'object' && !CID.asCID(element)) {
              yield * Block.tree(element, elementPath)
            }
          }
        } else {
          yield * Block.tree(value, path)
        }
      }
    }
  }

  /**
 * @template T
 * @param {T} source
 * @param {string[]} path
 */
  static get (source, path) {
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
}

/**
 * @template {number} Code
 * @template {number} Algorithm
 * @template T
 * @extends {Block<T>}
 * @implements {BlockInterface<T>}
 */
class BlockWithHasher extends Block {
  /**
   * @param {T} value
   * @param {ByteView<T>} bytes
   * @param {Code} code
   * @param {MultihashHasher<Algorithm>} hasher
   */
  constructor (value, bytes, code, hasher) {
    super(value, bytes)
    this.code = code
    this.hasher = hasher
    /** @type {Promise<CID>|CID|null} */
    this._cid = null
  }

  async cid () {
    if (this._cid) {
      return await this._cid
    } else {
      this._cid = BlockWithHasher.cid(this)
      const cid = await this._cid
      this._cid = cid
      return cid
    }
  }

  /**
   * @template {number} Code
   * @template {number} Algorithm
   * @template T
   * @param {BlockWithHasher<Code, Algorithm, T>} self
   */
  static async cid (self) {
    const digest = await self.hasher.digestBytes(self.bytes)
    return CID.createV1(self.code, digest)
  }
}

/**
 * @template T
 * @class
 * @extends {Block<T>}
 * @implements {BlockInterface<T>}
 */
class BlockWithCID extends Block {
  /**
   * @param {CID} cid
   * @param {T} value
   * @param {ByteView<T>} bytes
   */
  constructor (cid, value, bytes) {
    super(value, bytes)
    this._cid = cid
  }

  async cid () {
    return this._cid
  }
}

/**
 * @template T
 * @typedef {import('./interface').Block<T>} BlockInterface
 */

/**
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('../codecs/interface').BlockEncoder<Code, T>} BlockEncoder
 */

/**
 * @template {number} Code
 * @template T
 * @typedef {import('../codecs/interface').BlockDecoder<Code, T>} BlockDecoder
 */

/**
 * @template {number} Code
 * @typedef {import('../hashes/interface').MultihashHasher<Code>} MultihashHasher
 **/
