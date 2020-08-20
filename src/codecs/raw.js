// @ts-check

import { coerce } from '../bytes.js'
import { codec } from './codec.js'

/**
 * @param {Uint8Array} bytes
 * @returns {Uint8Array}
 */
const raw = (bytes) => coerce(bytes)

export default codec({
  name: 'raw',
  code: 85,
  decode: raw,
  encode: raw
})
