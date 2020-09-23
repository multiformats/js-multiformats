// # Multihash

/**
 * Represents a multihash digest which carries information about the
 * hashing alogrithm and an actual hash digest.
 */
// Note: In the current version there is no first class multihash
// representation (plain Uint8Array is used instead) instead there seems to be
// a bunch of places that parse it to extract (code, digest, size). By creating
// this first class representation we avoid reparsing and things generally fit
// really nicely.
export interface MultihashDigest<Code extends number> {
  /**
   * Code of the multihash
   */
  readonly code: Code

  /**
   * Raw digest (without a hashing algorithm info)
   */
  readonly digest: Uint8Array

  /**
   * byte length of the `this.digest`
   */
  readonly size: number

  /**
   * Binary representation of the this multihash digest.
   */
  readonly bytes: Uint8Array
}

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 */
export interface Hasher<Code extends number> {
  readonly code: Code


  digestBytes(bytes: Uint8Array): Promise<MultihashDigest<Code>>
}

export interface MultihashHasher<Code extends number> extends Hasher<Code> {
  readonly hashers: Record<Code, Hasher<Code>>

  digest(input: HashInput<Code>): Promise<MultihashDigest<Code>>
}

export interface HashInput<Code extends number> {
  readonly code: Code
  readonly bytes: Uint8Array
}

export type Await<T> =
  | Promise<T>
  | T
