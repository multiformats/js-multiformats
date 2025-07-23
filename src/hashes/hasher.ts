import * as Digest from './digest.js'
import type { MultihashHasher } from './interface.js'

type Await<T> = Promise<T> | T

const DEFAULT_MIN_DIGEST_LENGTH = 20

export interface HasherInit <Name extends string, Code extends number> {
  name: Name
  code: Code
  encode(input: Uint8Array): Await<Uint8Array>

  /**
   * The minimum length a hash is allowed to be truncated to in bytes
   *
   * @default 20
   */
  minDigestLength?: number

  /**
   * The maximum length a hash is allowed to be truncated to in bytes. If not
   * specified it will be inferred from the length of the digest.
   */
  maxDigestLength?: number
}

export function from <Name extends string, Code extends number> ({ name, code, encode, minDigestLength, maxDigestLength }: HasherInit<Name, Code>): Hasher<Name, Code> {
  return new Hasher(name, code, encode, minDigestLength, maxDigestLength)
}

export interface DigestOptions {
  /**
   * Truncate the returned digest to this number of bytes.
   *
   * This may cause the digest method to throw/reject if the passed value is
   * greater than the digest length or below a threshold under which the risk of
   * hash collisions is significant.
   *
   * The actual value of this threshold can depend on the hashing algorithm in
   * use.
   */
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
  readonly maxDigestLength?: number

  constructor (name: Name, code: Code, encode: (input: Uint8Array) => Await<Uint8Array>, minDigestLength?: number, maxDigestLength?: number) {
    this.name = name
    this.code = code
    this.encode = encode
    this.minDigestLength = minDigestLength ?? DEFAULT_MIN_DIGEST_LENGTH
    this.maxDigestLength = maxDigestLength
  }

  digest (input: Uint8Array, options?: DigestOptions): Await<Digest.Digest<Code, number>> {
    if (options?.truncate != null) {
      if (options.truncate < this.minDigestLength) {
        throw new Error(`Invalid truncate option, must be greater than or equal to ${this.minDigestLength}`)
      }

      if (this.maxDigestLength != null && options.truncate > this.maxDigestLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${this.maxDigestLength}`)
      }
    }

    if (input instanceof Uint8Array) {
      const result = this.encode(input)

      if (result instanceof Uint8Array) {
        return createDigest(result, this.code, options?.truncate)
      }

      return result.then(digest => createDigest(digest, this.code, options?.truncate))
    } else {
      throw Error('Unknown type, must be binary type')
      /* c8 ignore next 1 */
    }
  }
}

/**
 * Create a Digest from the passed uint8array and code, optionally truncating it
 * first.
 */
function createDigest <Code extends number> (digest: Uint8Array, code: Code, truncate?: number): Digest.Digest<Code, number> {
  if (truncate != null && truncate !== digest.byteLength) {
    if (truncate > digest.byteLength) {
      throw new Error(`Invalid truncate option, must be less than or equal to ${digest.byteLength}`)
    }

    digest = digest.subarray(0, truncate)
  }

  return Digest.create(code, digest)
}
