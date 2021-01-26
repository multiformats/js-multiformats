import CID from '../cid.js'
import random from 'js-crypto-random'
import aes from 'js-crypto-aes'

/**
 * @param {number} value
 */
const enc32 = value => {
  value = +value
  const buff = new Uint8Array(4)
  buff[3] = (value >>> 24)
  buff[2] = (value >>> 16)
  buff[1] = (value >>> 8)
  buff[0] = (value & 0xff)
  return buff
}

/**
 * @param {Uint8Array} buffer
 */
const readUInt32LE = (buffer) => {
  const offset = buffer.byteLength - 4
  return ((buffer[offset]) |
          (buffer[offset + 1] << 8) |
          (buffer[offset + 2] << 16)) +
          (buffer[offset + 3] * 0x1000000)
}

/**
 * @param {Uint8Array[]} buffers
 */
const concat = buffers => Uint8Array.from(buffers.map(b => [...b]).flat())

/**
 * @template {'aes-gcm' | 'aes-cbc' | 'aes-ctr'} Name
 * @template {number} Code
 * @param {Object} options
 * @param {Name} options.name
 * @param {Code} options.code
 * @param {number} options.ivsize
 */
const mkcrypto = ({ name, code, ivsize }) => {
  // Line below does a type cast, because type checker can't infer that
  // `toUpperCase` will result in desired string literal.
  const cyperType = /** @type {import('js-crypto-aes/dist/params').cipherTypes} */(name.toUpperCase())
  /**
   * @param {Object} options
   * @param {Uint8Array} options.key
   * @param {Object} options.value
   * @param {Uint8Array} options.value.bytes
   * @param {Uint8Array} options.value.iv
   */
  const decrypt = async ({ key, value: { iv, bytes } }) => {
    bytes = await aes.decrypt(bytes, key, { name: cyperType, iv, tagLength: 16 })
    const len = readUInt32LE(bytes.subarray(0, 4))
    const cid = CID.decode(bytes.subarray(4, 4 + len))
    bytes = bytes.subarray(4 + len)
    return { cid, bytes }
  }
  /**
   * @param {Object} options
   * @param {Uint8Array} options.key
   * @param {Uint8Array} options.bytes
   * @param {CID} options.cid
   */
  const encrypt = async ({ key, cid, bytes }) => {
    const len = enc32(cid.bytes.byteLength)
    const iv = random.getRandomBytes(ivsize)
    const msg = concat([len, cid.bytes, bytes])
    bytes = await aes.encrypt(msg, key, { name: cyperType, iv, tagLength: 16 })
    return { bytes, iv, code }
  }

  return {
    code,
    // Note: Do a type cast becasue `toLowerCase()` turns liternal type
    // into a string.
    name: /** @type {Name} */(name.toLowerCase()),
    encrypt,
    decrypt,
    ivsize
  }
}

const gcm = mkcrypto({ name: 'aes-gcm', code: 0x1401, ivsize: 12 })
const cbc = mkcrypto({ name: 'aes-cbc', code: 0x1402, ivsize: 16 })
const ctr = mkcrypto({ name: 'aes-ctr', code: 0x1403, ivsize: 12 })

export { gcm, cbc, ctr }
