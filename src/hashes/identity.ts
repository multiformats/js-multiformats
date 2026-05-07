import { coerce } from '../bytes.ts'
import * as Digest from './digest.ts'
import type { DigestOptions } from './hasher.ts'
import type { SyncMultihashHasher } from './interface.ts'

const code: 0x0 = 0x0
const name = 'identity'

const encode: (input: Uint8Array) => Uint8Array<ArrayBuffer> = coerce

function digest (input: Uint8Array, options?: DigestOptions): Digest.Digest<typeof code, number> {
  if (options?.truncate != null && options.truncate !== input.byteLength) {
    if (options.truncate < 0 || options.truncate > input.byteLength) {
      throw new Error(`Invalid truncate option, must be less than or equal to ${input.byteLength}`)
    }

    input = input.subarray(0, options.truncate)
  }

  return Digest.create(code, encode(input))
}

export const identity: SyncMultihashHasher<0x00> = { code, name, encode, digest }
