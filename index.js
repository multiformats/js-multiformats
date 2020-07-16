import varints from 'varint'
import createCID from 'multiformats/cid.js'
import * as bytes from 'multiformats/bytes.js'

const cache = new Map()
const varint = {
  decode: data => {
    const code = varints.decode(data)
    return [code, varints.decode.bytes]
  },
  encode: int => {
    if (cache.has(int)) return cache.get(int)
    const buff = Uint8Array.from(varints.encode(int))
    cache.set(int, buff)
    return buff
  }
}

const createMultihash = multiformats => {
  const { get, has, parse, add } = multiformats
  const decode = digest => {
    const [info, len] = parse(digest)
    digest = digest.slice(len)
    const [length, len2] = varint.decode(digest)
    digest = digest.slice(len2)
    return { code: info.code, name: info.name, length, digest }
  }
  const encode = (digest, id) => {
    let info
    if (typeof id === 'number') {
      info = { code: id }
    } else {
      info = get(id)
    }
    const code = varint.encode(info.code)
    const length = varint.encode(digest.length)
    return Uint8Array.from([...code, ...length, ...digest])
  }
  const hash = async (buff, key) => {
    buff = bytes.coerce(buff)
    const info = get(key)
    if (!info || !info.encode) throw new Error(`Missing hash implementation for "${key}"`)
    // https://github.com/bcoe/c8/issues/135
    /* c8 ignore next */
    return encode(await info.encode(buff), key)
  }
  const validate = async (_hash, buff) => {
    _hash = bytes.coerce(_hash)
    const { length, digest, code } = decode(_hash)
    if (digest.length !== length) throw new Error('Incorrect length')
    if (buff) {
      const { encode } = get(code)
      buff = await encode(buff)
      if (!bytes.equals(buff, digest)) throw new Error('Buffer does not match hash')
    }
    // https://github.com/bcoe/c8/issues/135
    /* c8 ignore next */
    return true
  }
  return { encode, has, decode, hash, validate, add, get }
}

const createMultibase = () => {
  const prefixMap = new Map()
  const nameMap = new Map()
  const _add = (prefix, name, encode, decode) => {
    prefixMap.set(prefix, [name, encode, decode])
    nameMap.set(name, [prefix, encode, decode])
  }
  const add = obj => {
    if (Array.isArray(obj)) {
      obj.forEach(add)
    } else {
      const { prefix, name, encode, decode } = obj
      _add(prefix, name, encode, decode)
    }
  }
  const get = id => {
    if (id.length === 1) {
      if (!prefixMap.has(id)) throw new Error(`Missing multibase implementation for "${id}"`)
      const [name, encode, decode] = prefixMap.get(id)
      return { prefix: id, name, encode, decode }
    } else {
      if (!nameMap.has(id)) throw new Error(`Missing multibase implementation for "${id}"`)
      const [prefix, encode, decode] = nameMap.get(id)
      return { prefix, name: id, encode, decode }
    }
  }
  const has = id => {
    if (id.length === 1) {
      return prefixMap.has(id)
    }
    return nameMap.has(id)
  }
  const encode = (buffer, id) => {
    buffer = bytes.coerce(buffer)
    const { prefix, encode } = get(id)
    return prefix + encode(buffer)
  }
  const decode = string => {
    if (typeof string !== 'string') throw new Error('Can only multibase decode strings')
    const prefix = string[0]
    string = string.slice(1)
    if (string.length === 0) return new Uint8Array(0)
    const { decode } = get(prefix)
    return Uint8Array.from(decode(string))
  }
  const encoding = string => get(string[0])
  return { add, has, get, encode, decode, encoding }
}

const create = (table = []) => {
  const intMap = new Map()
  const nameMap = new Map()
  const _add = (code, name, encode, decode) => {
    if (!Number.isInteger(code)) {
      throw new TypeError('multicodec entry must have an integer code')
    }
    if (typeof name !== 'string') {
      throw new TypeError('multicodec entry must have a string name')
    }
    if (encode != null && typeof encode !== 'function') {
      throw new TypeError('multicodec entry encode parameter must be a function')
    }
    if (decode != null && typeof decode !== 'function') {
      throw new TypeError('multicodec entry decode parameter must be a function')
    }
    intMap.set(code, [name, encode, decode])
    nameMap.set(name, [code, encode, decode])
  }
  for (const [code, name, encode, decode] of table) {
    _add(code, name, encode, decode)
  }
  const parse = buff => {
    buff = bytes.coerce(buff)
    const [code, len] = varint.decode(buff)
    let name, encode, decode
    if (intMap.has(code)) {
      ;[name, encode, decode] = intMap.get(code)
    }
    return [{ code, name, encode, decode }, len]
  }
  const get = obj => {
    if (typeof obj === 'string') {
      if (nameMap.has(obj)) {
        const [code, encode, decode] = nameMap.get(obj)
        return { code, name: obj, encode, decode }
      }
      throw new Error(`Do not have multiformat entry for "${obj}"`)
    }
    if (typeof obj === 'number') {
      if (intMap.has(obj)) {
        const [name, encode, decode] = intMap.get(obj)
        return { code: obj, name, encode, decode }
      }
      throw new Error(`Do not have multiformat entry for "${obj}"`)
    }
    if (bytes.isBinary(obj)) {
      return parse(bytes.coerce(obj))[0]
    }
    throw new Error('Unknown key type')
  }
  const has = id => {
    if (typeof id === 'string') {
      return nameMap.has(id)
    } else if (typeof id === 'number') {
      return intMap.has(id)
    }
    throw new Error('Unknown type')
  }
  // Ideally we can remove the coercion here once
  // all the codecs have been updated to use Uint8Array
  const encode = (value, id) => {
    const { encode } = get(id)
    return bytes.coerce(encode(value))
  }
  const decode = (value, id) => {
    const { decode } = get(id)
    return decode(bytes.coerce(value))
  }
  const add = obj => {
    if (Array.isArray(obj)) {
      obj.forEach(add)
    } else if (typeof obj === 'function') {
      add(obj(multiformats))
    } else {
      const { code, name, encode, decode } = obj
      _add(code, name, encode, decode)
    }
  }

  const multiformats = { parse, add, get, has, encode, decode, varint, bytes }
  multiformats.multicodec = { add, get, has, encode, decode }
  multiformats.multibase = createMultibase()
  multiformats.multihash = createMultihash(multiformats)
  multiformats.CID = createCID(multiformats)
  return multiformats
}
export { create, bytes, varint }
