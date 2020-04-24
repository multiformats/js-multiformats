const { Buffer } = require('buffer')
const varints = require('varint')
const createCID = require('./cid')

const cache = new Map()
const varint = {
  decode: data => {
    const code = varints.decode(data)
    return [code, varints.decode.bytes]
  },
  encode: int => {
    if (cache.has(int)) return cache.get(int)
    const buff = Buffer.from(varints.encode(int))
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
    return Buffer.concat([code, length, digest])
  }
  const hash = async (buff, key) => {
    const info = get(key)
    if (!info || !info.encode) throw new Error(`Missing hash implementation for "${key}"`)
    return encode(info.encode(buff), key)
  }
  const validate = (_hash, buff) => {
    const { length, digest, code } = decode(_hash)
    if (digest.length !== length) throw new Error('Incorrect length')
    if (buff) {
      const { encode } = get(code)
      if (encode(buff).compare(digest)) throw new Error('Buffer does not match hash')
    }
    return true
  }
  return { encode, decode, hash, validate, add, get }
}

const createMultibase = () => {
  const prefixMap = new Map()
  const nameMap = new Map()
  const _add = (prefix, name, encode, decode) => {
    prefixMap.set(prefix, [name, encode, decode])
    nameMap.set(name, [prefix, encode, decode])
  }
  const add = obj => {
    if (Array.isArray(obj)) obj.forEach(o => add(o))
    const { prefix, name, encode, decode } = obj
    _add(prefix, name, encode, decode)
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
  const encode = (buffer, id) => {
    if (!Buffer.isBuffer(buffer)) throw new Error('Can only multibase encode buffer instances')
    const { prefix, encode } = get(id)
    return encode(prefix + encode(buffer))
  }
  const decode = string => {
    if (typeof string !== 'string') throw new Error('Can only multibase decode strings')
    const prefix = string[0]
    string = string.slice(1)
    const { decode } = get(prefix)
    return decode(string)
  }
  return { add, get, encode, decode }
}

module.exports = (table = []) => {
  const intMap = new Map()
  const nameMap = new Map()
  const _add = (code, name, encode, decode) => {
    intMap.set(code, [name, encode, decode])
    nameMap.set(name, [code, encode, decode])
  }
  for (const [code, name, encode, decode] of table) {
    _add(code, name, encode, decode)
  }
  const parse = buff => {
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
    if (Buffer.isBuffer(obj)) {
      return parse(obj)[0]
    }
    throw new Error('Unknown key type')
  }
  const encode = (value, id) => {
    const { encode } = get(id)
    return encode(value)
  }
  const decode = (value, id) => {
    const { decode } = get(id)
    return decode(value)
  }
  const add = obj => {
    if (Array.isArray(obj)) obj.forEach(o => add(o))
    const { code, name, encode, decode } = obj
    _add(code, name, encode, decode)
  }
  const multiformats = { parse, add, get, encode, decode }
  multiformats.varint = varint
  multiformats.multicodec = { add, get, encode, decode }
  multiformats.multibase = createMultibase()
  multiformats.multihash = createMultihash(multiformats)
  multiformats.CID = createCID(multiformats)
  return multiformats
}
module.exports.varint = varint
