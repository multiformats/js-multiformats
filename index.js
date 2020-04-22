const { Buffer } = require('buffer')
const varints = require('varint')

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
  const decode = digest => {
    const [info, len] = multiformats.parse(digest)
    digest = digest.slice(len)
    const [length, len2] = varint.decode(digest)
    digest = digest.slice(len2)
    return { code: info.code, name: info.name, length, digest }
  }
  const encode = (digest, id) => {
    const info = multiformats.get(id)
    const code = varint.encode(info.code)
    const length = varint.encode(digest.length)
    return Buffer.concat([code, length, digest])
  }
  const hash = (buff, key) => {
    const info = multiformats.get(key)
    if (!info || !info.encode) throw new Error(`Missing hash implementation for "${key}"`)
    return encode(info.encode(buff), key)
  }
  const validate = buff => {
    const { length, digest } = decode(buff)
    if (digest.length !== length) throw new Error('Incorrect length')
    return true
  }
  return { encode, decode, hash, validate, add: multiformats.add }
}

const createCID = multiformats => {
}

const createMultibase = () => {
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
      let code, encode, decode
      if (nameMap.has(obj)) {
        ;[code, encode, decode] = nameMap.get(obj)
        return { code, name: obj, encode, decode }
      }
      throw new Error(`Do not have multiformat entry for "${obj}"`)
    }
    if (typeof obj === 'number') {
      let name, encode, decode
      if (intMap.has(obj)) {
        ;[name, encode, decode] = intMap.get(obj)
      }
      return { code: obj, name, encode, decode }
    }
    if (Buffer.isBuffer(obj)) {
      return parse(obj)[0]
    }
    throw new Error('Unknown key type')
  }
  const add = obj => {
    const { code, name, encode, decode } = obj
    _add(code, name, encode, decode)
  }
  const multiformats = { parse, add, get }
  multiformats.multibase = createMultibase()
  multiformats.multihash = createMultihash(multiformats)
  multiformats.CID = createCID(multiformats)
  return multiformats
}
module.exports.varint = varint
