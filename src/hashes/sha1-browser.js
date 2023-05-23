/* global crypto */

import { from } from './hasher.js'

/**
 * @param {AlgorithmIdentifier} name
 */
const sha = name =>
  /**
   * @param {Uint8Array} data
   */
  async data => new Uint8Array(await crypto.subtle.digest(name, data))

export const sha1 = from({
  name: 'sha-1',
  code: 0x11,
  encode: sha('SHA-1')
})
