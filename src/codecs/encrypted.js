// @ts-check
import * as varint from '../varint.js'
import { codec } from './codec.js'

const code = 0x1400

/**
 * @template {number} Code
 * @param {Object} options
 * @param {Uint8Array} options.bytes
 * @param {Uint8Array} options.iv
 * @param {Code} options.code
 * @returns {Uint8Array}
 */
const encode = ({ iv, code, bytes }) => {
  const codeLength = varint.encodingLength(code)
  const ivsizeLength = varint.encodingLength(iv.byteLength)
  const length = codeLength + ivsizeLength + iv.byteLength + bytes.byteLength
  const buff = new Uint8Array(length)
  varint.encodeTo(code, buff)
  let offset = codeLength
  varint.encodeTo(iv.byteLength, buff, offset)
  offset += ivsizeLength
  buff.set(iv, offset)
  offset += iv.byteLength
  buff.set(bytes, offset)
  return buff
}

/**
 * @param {Uint8Array} bytes
 */
const decode = bytes => {
  const [code, vlength] = varint.decode(bytes)
  let offset = vlength
  const [ivsize, ivsizeLength] = varint.decode(bytes.subarray(offset))
  offset += ivsizeLength
  const iv = bytes.subarray(offset, offset + ivsize)
  offset += ivsize
  bytes = bytes.slice(offset)
  return { iv, code, bytes }
}

export default codec({ encode, decode, code, name: 'encrypted' })
