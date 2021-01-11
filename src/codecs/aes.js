import random from 'js-crypto-random'
import aes from 'js-crypto-aes'
import CID from '../cid.js'
import { codec } from './codec.js'

const enc32 = value => {
  value = +value
  const buff = new Uint8Array(4)
  buff[3] = (value >>> 24)
  buff[2] = (value >>> 16)
  buff[1] = (value >>> 8)
  buff[0] = (value & 0xff)
  return buff
}

const readUInt32LE = (buffer) => {
  const offset = buffer.byteLength - 4
  return ((buffer[offset]) |
          (buffer[offset + 1] << 8) |
          (buffer[offset + 2] << 16)) +
          (buffer[offset + 3] * 0x1000000)
}

let code = 0x1400

const concat = buffers => Uint8Array.from(buffers.map(b => [...b]).flat())

const mkcrypto = ({ name, code, ivsize }) => {
  const encode = ({ iv, bytes }) => concat([iv, bytes])

  const decode = bytes => {
    const iv = bytes.subarray(0, ivsize)
    bytes = bytes.slice(ivsize)
    return { iv, bytes }
  }

  const decrypt = async ({ key, value }) => {
    let { bytes, iv } = value
    bytes = await aes.decrypt(bytes, key, { name: name.toUpperCase(), iv, tagLength: 16 })
    const len = readUInt32LE(bytes.subarray(0, 4))
    const cid = CID.decode(bytes.subarray(4, 4 + len))
    bytes = bytes.subarray(4 + len)
    return { cid, bytes }
  }
  const encrypt = async ({ key, cid, bytes }) => {
    const len = enc32(cid.bytes.byteLength)
    const iv = random.getRandomBytes(ivsize)
    const msg = concat([len, cid.bytes, bytes])
    bytes = await aes.encrypt(msg, key, { name: name.toUpperCase(), iv, tagLength: 16 })
    return { bytes, iv }
  }
  return { encode, decode, encrypt, decrypt, code, name: name.toLowerCase() }
}

const gcm = codec(mkcrypto({ name: 'aes-gcm', code: code++, ivsize: 12 }))
const cbc = codec(mkcrypto({ name: 'aes-cbc', code: code++, ivsize: 16 }))
const ctr = codec(mkcrypto({ name: 'aes-ctr', code: code++, ivsize: 12 }))

export { gcm, cbc, ctr }
