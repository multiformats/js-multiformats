import transform from 'lodash.transform'
import { bytes, CID } from './index.js'

const readonly = value => ({ get: () => value, set: () => { throw new Error('Cannot set read-only property') } })

const immutableTypes = new Set(['number', 'string', 'boolean'])

const { coerce, isBinary } = bytes
const copyBinary = value => {
  const b = coerce(value)
  return coerce(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
}

const clone = obj => transform(obj, (result, value, key) => {
  const cid = CID.asCID(value)
  if (cid) {
    result[key] = cid
  } else if (isBinary(value)) {
    result[key] = copyBinary(value)
  } else if (typeof value === 'object' && value !== null) {
    result[key] = clone(value)
  } else {
    result[key] = value
  }
})

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
  constructor ({ codec, hasher, source, cid, data }) {
    if (codec) setImmutable(this, '_codec', codec)
    if (hasher) setImmutable(this, '_hasher', hasher)
    if (source) setImmutable(this, '_source', source)
    if (cid) setImmutable(this, '_cid', cid)
    if (data) setImmutable(this, '_data', data)
    setImmutable(this, 'asBlock', this)
  }

  decodeUnsafe () {
    if (typeof this._source !== 'undefined') return this._source
    throw new Error('Block created without a decoded state')
  }

  decode () {
    const decoded = this.decodeUnsafe()
    if (decoded === null) return null
    if (isBinary(decoded)) return copyBinary(decoded)
    if (immutableTypes.has(typeof decoded) || decoded === null) {
      return decoded
    }
    return clone(decoded)
  }

  encodeUnsafe () {
    if (this._data) return this._data
    throw new Error('Block created without an encoded state')
  }

  encode () {
    const data = this.encodeUnsafe()
    return copyBinary(data)
  }

  async cid () {
    if (this._cid) return this._cid
    const hash = await this._hasher.digest(this.encodeUnsafe())
    const cid = CID.create(1, this._codec.code, hash)
    setImmutable(this, '_cid', cid)
    return cid
  }

  get code () {
    if (this._cid) return this._cid.code
    return this._codec.code
  }

  async equals (block) {
    if (block === this) return true
    if (block.asBlock !== block) return false
    const [a, b] = await Promise.all([this.cid(), block.cid()])
    return a.equals(b)
  }

  links () {
    return links(this.decodeUnsafe())
  }

  tree () {
    return tree(this.decodeUnsafe())
  }
}

class BlockDecoder extends Block {
  decodeUnsafe () {
    if (typeof this._source !== 'undefined') return this._source
    if (!this._codec) {
      throw new Error('Do not have codec implemention in this Block interface')
    }
    const source = this._codec.decode(this._data)
    setImmutable(this, '_source', source)
    return source
  }
}
class BlockEncoder extends Block {
  encodeUnsafe () {
    if (this._data) return this._data
    if (!this._codec) {
      throw new Error('Do not have codec implemention in this Block interface')
    }
    const data = this._codec.encode(this._source)
    setImmutable(this, '_data', data)
    return data
  }
}

const encoder = ({ source, codec, hasher }) => {
  if (typeof source === undefined) throw new Error('Missing required argument "source"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')
  return new BlockEncoder({ source, codec, hasher })
}
const decoder = ({ data, codec, hasher }) => {
  if (!data) throw new Error('Missing required argument "data"')
  if (!codec || !hasher) throw new Error('Missing required argument: codec or hasher')
  return new BlockDecoder({ data, codec, hasher })
}
const createUnsafe = ({ data, cid, codec, hasher }) => {
  if (!codec) throw new Error('Missing required argument "codec"')
  return new BlockDecoder({ data, cid, codec, hasher })
}
const create = async ({ data, cid, hasher, codec }) => {
  if (!data) throw new Error('Missing required argument "data"')
  if (!hasher) throw new Error('Missing required argument "hasher"')
  const hash = await hasher.digest(data)
  if (!bytes.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match data')
  }
  return createUnsafe({ data, cid, hasher, codec })
}

export { encoder, decoder, create, createUnsafe, Block }
