import { coerce } from '../bytes.js'
import * as Digest from './digest.js'

export const code = 0x0
export const name = 'identity'

/**
 * @param {Uint8Array} input
 * @returns {Digest.Digest<typeof code, number>}
 */
export const digest = (input) => Digest.create(code, coerce(input))

/** @type {import('./interface').SyncMultihashHasher<typeof code>} */
export const identity = { code, name, digest }
