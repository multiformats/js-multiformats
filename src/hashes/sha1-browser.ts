/* global crypto */

import { from } from './hasher.ts'

const sha = (name: AlgorithmIdentifier) =>
  async (data: Uint8Array) => new Uint8Array(await crypto.subtle.digest(name, data))

export const sha1 = from({
  name: 'sha-1',
  code: 0x11,
  encode: sha('SHA-1')
})
