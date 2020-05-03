const varints = require('varint')
const createCID = require('./cid')

const { Buffer } = require('buffer')

// From https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript/50868276#50868276
const toHex = (data) =>
  data.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '')
// TODO 2020-05-03: This is slow, but simple
const fromHex = (hex) => {
  return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => {
    return parseInt(byte, 16)
  }))
}


const isUint8Array = (data) => {
  return Object.prototype.toString.call(data) === '[object Uint8Array]'
}

const uint8ArrayEquals = (aa, bb) => {
  if (aa.byteLength != bb.byteLength) {
    return false
  }

  for (let ii = 0; ii < aa.byteLength; ii++) {
    if (aa[ii] !== bb[ii]) {
      return false
    }
  }

  return true
}

const bufferToUint8Array = (buffer) => {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

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
    if (!isUint8Array(buff)) throw new Error('Can only hash Uint8Array instances')
    const info = get(key)
    if (!info || !info.encode) throw new Error(`Missing hash implementation for "${key}"`)
    return encode(await info.encode(buff), key)
  }
  const validate = async (_hash, buff) => {
    const { length, digest, code } = decode(_hash)
    if (digest.length !== length) throw new Error('Incorrect length')
    if (buff) {
      const { encode } = get(code)
      buff = await encode(buff)
      debugger
      if (!uint8ArrayEquals(buff, digest)) throw new Error('Buffer does not match hash')
    }
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
    if (!isUint8Array(buffer)) throw new Error('Can only multibase encode buffer instances')
    const { prefix, encode } = get(id)
    return prefix + encode(buffer)
  }
  const decode = string => {
    if (typeof string !== 'string') throw new Error('Can only multibase decode strings')
    const prefix = string[0]
    string = string.slice(1)
    const { decode } = get(prefix)
    return decode(string)
  }
  const encoding = string => get(string[0])
  return { add, get, encode, decode, encoding }
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
    if (isUint8Array(obj)) {
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

  multiformats.bufferApi = {
    multicodec: {
      add,
      get,
      encode: (value, id) => {
        debugger
        if (Buffer.isBuffer(value)) {
          value = bufferToUint8Array(value)
        }
        const encoded = multiformats.encode(value, id)
        const encodedBuffer = Buffer.from(encoded)
        return encodedBuffer
      },
      decode: (valueBuffer, id) => {
        const value = bufferToUint8Array(valueBuffer)
        const decoded = multiformats.decode(value, id)
        if (isUint8Array(decoded)) {
          return Buffer.from(decoded)
        } else {
          return decoded
        }
      }
    },
    multihash: {
      add,
      get,
      parse,
      hash: async (valueBuffer, key) => {
        if (!Buffer.isBuffer(valueBuffer)) {
          throw new Error('Can only hash Buffer instances')
        }
        const value = bufferToUint8Array(valueBuffer)
        return multiformats.multihash.hash(value, key)
      },
      encode: (digestBuffer, id) => {
        const digest = bufferToUint8Array(digestBuffer)
        return Buffer.from(multiformats.multihash.encode(digest, id))
      },
      decode: (digestBuffer) => {
        const digest = bufferToUint8Array(digestBuffer)
        const decoded = multiformats.multihash.decode(digest)
        decoded.digest = Buffer.from(decoded.digest)
        return decoded
      },
      validate: async (hash, digestBuffer) => {
        if (digestBuffer !== undefined) {
          const digest = bufferToUint8Array(digestBuffer)
          return multiformats.multihash.validate(hash, digest)
        } else {
          return multiformats.multihash.validate(hash)
        }
      }
    }
  }

  return multiformats
}
module.exports.fromHex = fromHex
module.exports.toHex = toHex
module.exports.varint = varint
