import { bytes as binary, CID } from './index.js'
// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from './interface.js'

const readonly = ({ enumerable = true, configurable = false } = {}) => ({
  enumerable,
  configurable,
  writable: false
})

/**
 * @template T
 * @param {T} source
 * @param {Array<string|number>} base
 * @returns {Iterable<[string, API.CIDView]>}
 */
const links = function * (source, base) {
  if (source == null) return
  if (source instanceof Uint8Array) return
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
  if (source == null) return
  for (const [key, value] of Object.entries(source)) {
    const path = [...base, key]
    yield path.join('/')
    if (value != null && !(value instanceof Uint8Array) && typeof value === 'object' && !CID.asCID(value)) {
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
 * @return {API.BlockCursorView<unknown>}
 */
const get = (source, path) => {
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
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} C - multicodec code corresponding to codec used to encode the block
 * @template {number} A - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.CIDVersion} V - CID version
 * @implements {API.BlockView<T, C, A, V>}
 */
class Block {
  /**
   * @param {Object} options
   * @param {API.CIDView<C, A, V>} options.cid
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
   * @param {string} [path]
   * @return {API.BlockCursorView<unknown>}
   */
  get (path = '/') {
    return get(this.value, path.split('/').filter(Boolean))
  }
}

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @param {Object} options
 * @param {T} options.value
 * @param {API.BlockEncoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg>>}
 */
const encode = async ({ value, codec, hasher }) => {
  if (typeof value === 'undefined') throw new Error('Missing required argument "value"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')

  const bytes = codec.encode(value)
  const hash = await hasher.digest(bytes)
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
 * @param {Object} options
 * @param {API.ByteView<T>} options.bytes
 * @param {API.BlockDecoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg>>}
 */
const decode = async ({ bytes, codec, hasher }) => {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')

  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  const cid = CID.create(1, codec.code, hash)

  return new Block({ value, bytes, cid })
}

/**
 * @typedef {Object} RequiredCreateOptions
 * @property {API.CID} options.cid
 */

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.CIDVersion} V - CID version
 * @param {{ cid: API.Link<T, Code, Alg, V>, value:T, codec?: API.BlockDecoder<Code, T>, bytes: API.ByteView<T> }|{cid:API.Link<T, Code, Alg, V>, bytes:API.ByteView<T>, value?:void, codec:API.BlockDecoder<Code, T>}} options
 * @returns {API.BlockView<T, Code, Alg, V>}
 */
const createUnsafe = ({ bytes, cid, value: maybeValue, codec }) => {
  const value = maybeValue !== undefined
    ? maybeValue
    : (codec && codec.decode(bytes))

  if (value === undefined) throw new Error('Missing required argument, must either provide "value" or "codec"')

  return new Block({
    // eslint-disable-next-line object-shorthand
    cid: /** @type {API.CIDView<Code, Alg, V>} */ (cid),
    bytes,
    value
  })
}

/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.CIDVersion} V - CID version
 * @param {Object} options
 * @param {API.CID<Code, Alg, V>} options.cid
 * @param {API.ByteView<T>} options.bytes
 * @param {API.BlockDecoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg, V>>}
 */
const create = async ({ bytes, cid, hasher, codec }) => {
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
