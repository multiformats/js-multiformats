import { coerce } from '../bytes.js'
import * as Digest from './digest.js'
import type { DigestOptions } from './hasher.js'

const code: 0x0 = 0x0
const name = 'identity'

const encode: (input: Uint8Array) => Uint8Array = coerce

function digest (input: Uint8Array, options?: DigestOptions): Digest.Digest<typeof code, number> {
  if (options?.truncate != null && options.truncate !== input.byteLength) {
    if (options.truncate < 0 || options.truncate > input.byteLength) {
      throw new Error(`Invalid truncate option, must be less than or equal to ${input.byteLength}`)
    }

    input = input.subarray(0, options.truncate)
  }

  return Digest.create(code, encode(input))
}

export const identity = { code, name, encode, digest }
