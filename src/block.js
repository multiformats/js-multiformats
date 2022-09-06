import { bytes as binary, CID } from './index.js'
// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from './interface.js'

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
 *
 * @template T
 * @param {T} source
 * @param {string[]} path
 * @returns {API.BlockCursorView<unknown>}
 */
function get (source, path) {
  let node = /** @type {Record<string, any>} */(source)
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
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} C - multicodec code corresponding to codec used to encode the block
 * @template {number} A - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} V - CID version
 * @implements {API.BlockView<T, C, A, V>}
 */
class Block {
  /**
   * @param {object} options
   * @param {CID<T, C, A, V>} options.cid
   * @param {API.ByteView<T>} options.bytes
   * @param {T} options.value
   */
  constructor ({ cid, bytes, value }) {
    if (!cid || !bytes || typeof value === 'undefined') { throw new Error('Missing required argument') }

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
   *
   * @param {string} [path]
   * @returns {API.BlockCursorView<unknown>}
   */
  get (path = '/') {
    return get(this.value, path.split('/').filter(Boolean))
  }
}

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @param {object} options
 * @param {T} options.value
 * @param {API.BlockEncoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg>>}
 */
async function encode ({ value, codec, hasher }) {
  if (typeof value === 'undefined') throw new Error('Missing required argument "value"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')

  const bytes = codec.encode(value)
  const hash = await hasher.digest(bytes)
  /** @type {CID<T, Code, Alg, 1>} */
  const cid = CID.create(
    1,
    codec.code,
    hash
  )

  return new Block({ value, bytes, cid })
}

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @param {object} options
 * @param {API.ByteView<T>} options.bytes
 * @param {API.BlockDecoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg>>}
 */
async function decode ({ bytes, codec, hasher }) {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')

  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  /** @type {CID<T, Code, Alg, 1>} */
  const cid = CID.create(1, codec.code, hash)

  return new Block({ value, bytes, cid })
}

/**
 * @typedef {object} RequiredCreateOptions
 * @property {CID} options.cid
 */

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} V - CID version
 * @param {{ cid: API.Link<T, Code, Alg, V>, value:T, codec?: API.BlockDecoder<Code, T>, bytes: API.ByteView<T> }|{cid:API.Link<T, Code, Alg, V>, bytes:API.ByteView<T>, value?:void, codec:API.BlockDecoder<Code, T>}} options
 * @returns {API.BlockView<T, Code, Alg, V>}
 */
function createUnsafe ({ bytes, cid, value: maybeValue, codec }) {
  const value = maybeValue !== undefined
    ? maybeValue
    : (codec && codec.decode(bytes))

  if (value === undefined) throw new Error('Missing required argument, must either provide "value" or "codec"')

  return new Block({
    // eslint-disable-next-line object-shorthand
    cid: /** @type {CID<T, Code, Alg, V>} */ (cid),
    bytes,
    value
  })
}

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} V - CID version
 * @param {object} options
 * @param {API.Link<T, Code, Alg, V>} options.cid
 * @param {API.ByteView<T>} options.bytes
 * @param {API.BlockDecoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg, V>>}
 */
async function create ({ bytes, cid, hasher, codec }) {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!hasher) throw new Error('Missing required argument "hasher"')
  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  if (!binary.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match bytes')
  }

  return createUnsafe({
    bytes,
    cid,
    value,
    codec
  })
}

export { encode, decode, create, createUnsafe, Block }
