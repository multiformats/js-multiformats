import * as Digest from './digest.js'
import type { MultihashHasher } from './interface.js'

type Await<T> = Promise<T> | T

const DEFAULT_MIN_DIGEST_LENGTH = 20
const DEFAULT_MAX_DIGEST_LENGTH = 128

export interface HasherInit <Name extends string, Code extends number> {
  name: Name
  code: Code
  encode(input: Uint8Array): Await<Uint8Array>

  /**
   * The minimum length a hash is allowed to be in bytes
   *
   * @default 20
   */
  minDigestLength?: number

  /**
   * The maximum length a hash is allowed to be in bytes
   *
   * @default 128
   */
  maxDigestLength?: number
}

export function from <Name extends string, Code extends number> ({ name, code, encode, minDigestLength, maxDigestLength }: HasherInit<Name, Code>): Hasher<Name, Code> {
  return new Hasher(name, code, encode, minDigestLength, maxDigestLength)
}

export interface DigestOptions {
  truncate?: number
}

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 */
export class Hasher<Name extends string, Code extends number> implements MultihashHasher<Code> {
  readonly name: Name
  readonly code: Code
  readonly encode: (input: Uint8Array) => Await<Uint8Array>
  readonly minDigestLength: number
  readonly maxDigestLength: number

  constructor (name: Name, code: Code, encode: (input: Uint8Array) => Await<Uint8Array>, minDigestLength?: number, maxDigestLength?: number) {
    this.name = name
    this.code = code
    this.encode = encode
    this.minDigestLength = minDigestLength ?? DEFAULT_MIN_DIGEST_LENGTH
    this.maxDigestLength = maxDigestLength ?? DEFAULT_MAX_DIGEST_LENGTH
  }

  digest (input: Uint8Array, options?: DigestOptions): Await<Digest.Digest<Code, number>> {
    if (options?.truncate != null) {
      if (options.truncate < this.minDigestLength) {
        throw new Error(`Invalid truncate option, must be greater than or equal to ${this.minDigestLength}`)
      }

      if (options.truncate > this.maxDigestLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${this.maxDigestLength}`)
      }
    }

    if (input instanceof Uint8Array) {
      let result = this.encode(input)

      if (result instanceof Uint8Array) {
        if (options?.truncate != null) {
          result = result.subarray(0, options.truncate)
        }

        return Digest.create(this.code, result)
      }

      return result.then(digest => {
        if (options?.truncate != null) {
          digest = digest.subarray(0, options.truncate)
        }

        return Digest.create(this.code, digest)
      })
    } else {
      throw Error('Unknown type, must be binary type')
      /* c8 ignore next 1 */
    }
  }
}
