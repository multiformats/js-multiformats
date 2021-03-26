// @ts-check

import { coerce } from '../bytes.js'
import { codec } from './codec.js'

/**
 * @param {Uint8Array} bytes
 * @returns {Uint8Array}
 */
const rawEncodeDecode = (bytes) => coerce(bytes)

export const { name, code, decode, encode, decoder, encoder } = codec({
  name: 'raw',
  code: 85,
  decode: rawEncodeDecode,
  encode: rawEncodeDecode
})
