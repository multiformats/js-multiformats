// @ts-check

import { coerce } from '../bytes.js'

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @param {Uint8Array} bytes
 * @returns {Uint8Array}
 */
const raw = (bytes) => coerce(bytes)

/**
 * @template T
 * @type {BlockCodec<0x55, Uint8Array>}
 */
export const { name, code, encode, decode } = {
  name: 'raw',
  code: 0x55,
  decode: raw,
  encode: raw
}
