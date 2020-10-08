import { bytes as binary, CID } from './index.js'

const readonly = value => ({ get: () => value, set: () => { throw new Error('Cannot set read-only property') } })

const setImmutable = (obj, key, value) => {
  if (typeof value === 'undefined') throw new Error(`${key} cannot be undefined`)
  Object.defineProperty(obj, key, readonly(value))
}

/* eslint-disable max-depth */
const links = function * (decoded, path = []) {
  if (typeof decoded !== 'object' || !decoded) return
  for (const key of Object.keys(decoded)) {
    const _path = path.slice()
    _path.push(key)
    const val = decoded[key]
    if (val && typeof val === 'object') {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          const __path = _path.slice()
          __path.push(i)
          const o = val[i]
          const cid = CID.asCID(o)
          if (cid) {
            yield [__path.join('/'), cid]
          } else if (typeof o === 'object') {
            yield * links(o, __path)
          }
        }
      } else {
        const cid = CID.asCID(val)
        if (cid) {
          yield [_path.join('/'), cid]
        } else {
          yield * links(val, _path)
        }
      }
    }
  }
}

const tree = function * (decoded, path = []) {
  if (typeof decoded !== 'object' || !decoded) return
  for (const key of Object.keys(decoded)) {
    const _path = path.slice()
    _path.push(key)
    yield _path.join('/')
    const val = decoded[key]
    if (val && typeof val === 'object' && !CID.asCID(val)) {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          const __path = _path.slice()
          __path.push(i)
          const o = val[i]
          yield __path.join('/')
          if (typeof o === 'object' && !CID.asCID(o)) {
            yield * tree(o, __path)
          }
        }
      } else {
        yield * tree(val, _path)
      }
    }
  }
}
/* eslint-enable max-depth */

class Block {
  constructor ({ cid, bytes, value }) {
    if (!cid || !bytes || typeof value === 'undefined') throw new Error('Missing required argument')
    setImmutable(this, 'bytes', bytes)
    setImmutable(this, 'value', value)
    setImmutable(this, 'cid', cid)
    setImmutable(this, 'asBlock', this)
  }

  links () {
    return links(this.value)
  }

  tree () {
    return tree(this.value)
  }

  get (path) {
    let node = this.value
    path = path.split('/').filter(x => x)
    while (path.length) {
      const key = path.shift()
      if (node[key] === undefined) { throw new Error(`Object has no property ${key}`) }
      node = node[key]
      const cid = CID.asCID(node)
      if (cid) return { value: cid, remaining: path.join('/') }
    }
    return { value: node }
  }
}

const encode = async ({ value, codec, hasher }) => {
  if (typeof value === 'undefined') throw new Error('Missing required argument "value"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')
  const bytes = codec.encode(value)
  const hash = await hasher.digest(bytes)
  const cid = CID.create(1, codec.code, hash)
  return new Block({ value, bytes, cid })
}
const decode = async ({ bytes, codec, hasher }) => {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')
  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  const cid = CID.create(1, codec.code, hash)
  return new Block({ value, bytes, cid })
}
const createUnsafe = ({ bytes, cid, value, codec }) => {
  if (!codec) throw new Error('Missing required argument "codec"')
  if (typeof value === 'undefined') value = codec.decode(bytes)
  return new Block({ bytes, cid, value })
}
const create = async ({ bytes, cid, hasher, codec }) => {
  if (!bytes) throw new Error('Missing required argument "bytes"')
  if (!hasher) throw new Error('Missing required argument "hasher"')
  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  if (!binary.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match bytes')
  }
  return createUnsafe({ bytes, cid, value, codec, hasher })
}

export { encode, decode, create, createUnsafe, Block }
