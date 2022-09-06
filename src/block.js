import { bytes as binary, CID } from './index.js'

function readonly ({ enumerable = true, configurable = false } = {}) {
  return { enumerable, configurable, writable: false }
}

/**
 * @param {[string|number, string]} path
 * @param {any} value
 * @returns {Iterable<[string, CID]>}
 */
function * linksWithin (path, value) {
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

/**
 * @template T
 * @param {T} source
 * @param {Array<string|number>} base
 * @returns {Iterable<[string, CID]>}
 */
function * links (source, base) {
  if (source == null || source instanceof Uint8Array) {
    return
  }
  for (const [key, value] of Object.entries(source)) {
    const path = /** @type {[string|number, string]} */ ([...base, key])
    yield * linksWithin(path, value)
  }
}

/**
 * @param {[string|number, string]} path
 * @param {any} value
 * @returns {Iterable<string>}
 */
function * treeWithin (path, value) {
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

/**
 * @template T
 * @param {T} source
 * @param {Array<string|number>} base
 * @returns {Iterable<string>}
 */
function * tree (source, base) {
  if (source == null || typeof source !== 'object') {
    return
  }
  for (const [key, value] of Object.entries(source)) {
    const path = /** @type {[string|number, string]} */ ([...base, key])
    yield path.join('/')
    if (value != null && !(value instanceof Uint8Array) && typeof value === 'object' && !CID.asCID(value)) {
      yield * treeWithin(path, value)
    }
  }
}

/**
 * @template T
 * @param {T} source
 * @param {string[]} path
 */
function get (source, path) {
  let node = /** @type {Record<string, any>} */ (source)
  for (const [index, key] of path.entries()) {
    node = node[key]
    if (node == null) {
      throw new Error(`Object has no property at ${path.slice(0, index + 1).map(part => `[${JSON.stringify(part)}]`).join('')}`)
    }
    const cid = CID.asCID(node)
    if (cid) {
      return { value: cid, remaining: path.slice(index + 1).join('/') }
    }
  }
  return { value: node }
}

/**
 * @template T
 */
class Block {
  /**
   * @param {object} options
   * @param {CID} options.cid
   * @param {ByteView<T>} options.bytes
   * @param {T} options.value
   */
  constructor ({ cid, bytes, value }) {
    if (!cid || !bytes || typeof value === 'undefined') throw new Error('Missing required argument')

    this.cid = cid
    this.bytes = bytes
    this.value = value
    this.asBlock = this

    // Mark all the properties immutable
    Object.defineProperties(this, {
      cid: readonly(),
      bytes: readonly(),
      value: readonly(),
      asBlock: readonly()
    })
  }

  links () {
    return links(this.value, [])
  }

  tree () {
    return tree(this.value, [])
  }

  /**
   * @param {string} [path]
   */
  get (path = '/') {
    return get(this.value, path.split('/').filter(Boolean))
  }
}

/**
 * @template T
 * @template {number} Code
 * @template {number} Algorithm
 * @param {object} options
 * @param {T} options.value
 * @param {BlockEncoder<Code, T>} options.codec
 * @param {Hasher<Algorithm>} options.hasher
 * @returns {Promise<Block<T>>}
 */
async function encode ({ value, codec, hasher }) {
  if (typeof value === 'undefined') throw new Error('Missing required argument "value"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')

  const bytes = codec.encode(value)
  const hash = await hasher.digest(bytes)
  const cid = CID.create(1, codec.code, hash)

  return new Block({ value, bytes, cid })
}

/**
 * @template T
 * @template {number} Code
 * @template {number} Algorithm
 * @param {object} options
 * @param {ByteView<T>} options.bytes
 * @param {BlockDecoder<Code, T>} options.codec
 * @param {Hasher<Algorithm>} options.hasher
 * @returns {Promise<Block<T>>}
 */
async function decode ({ bytes, codec, hasher }) {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')

  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  const cid = CID.create(1, codec.code, hash)

  return new Block({ value, bytes, cid })
}

/**
 * @typedef {object} RequiredCreateOptions
 * @property {CID} options.cid
 */

/**
 * @template T
 * @template {number} Code
 * @param {{ cid: CID, value:T, codec?: BlockDecoder<Code, T>, bytes: ByteView<T> }|{cid:CID, bytes:ByteView<T>, value?:void, codec:BlockDecoder<Code, T>}} options
 * @returns {Block<T>}
 */
function createUnsafe ({ bytes, cid, value: maybeValue, codec }) {
  const value = maybeValue !== undefined
    ? maybeValue
    : (codec && codec.decode(bytes))

  if (value === undefined) throw new Error('Missing required argument, must either provide "value" or "codec"')

  return new Block({ cid, bytes, value })
}

/**
 * @template T
 * @template {number} Code
 * @template {number} Algorithm
 * @param {object} options
 * @param {CID} options.cid
 * @param {ByteView<T>} options.bytes
 * @param {BlockDecoder<Code, T>} options.codec
 * @param {Hasher<Algorithm>} options.hasher
 * @returns {Promise<Block<T>>}
 */
async function create ({ bytes, cid, hasher, codec }) {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!hasher) throw new Error('Missing required argument "hasher"')
  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  if (!binary.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match bytes')
  }

  return createUnsafe({ bytes, cid, value, codec })
}

export { encode, decode, create, createUnsafe, Block }

/**
 * @template T
 * @typedef {import('./codecs/interface').ByteView<T>} ByteView
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
 * @template Algorithm
 * @typedef {import('./hashes/interface').MultihashHasher} Hasher
 */
