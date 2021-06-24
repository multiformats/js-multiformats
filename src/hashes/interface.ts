// # Multihash

/**
 * Represents a multihash digest which carries information about the
 * hashing algorithm and an actual hash digest.
 */
// Note: In the current version there is no first class multihash
// representation (plain Uint8Array is used instead) instead there seems to be
// a bunch of places that parse it to extract (code, digest, size). By creating
// this first class representation we avoid reparsing and things generally fit
// really nicely.
export interface MultihashDigest {
  /**
   * Code of the multihash
   */
  code: number

  /**
   * Raw digest (without a hashing algorithm info)
   */
  digest: Uint8Array

  /**
   * byte length of the `this.digest`
   */
  size: number

  /**
   * Binary representation of the this multihash digest.
   */
  bytes: Uint8Array
}

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 */
export interface MultihashHasher {
  /**
   * Takes binary `input` and returns it (multi) hash digest.
   * @param {Uint8Array} input
   */
  digest(input: Uint8Array): Promise<MultihashDigest>

  /**
   * Name of the multihash
   */
   name: string

  /**
   * Code of the multihash
   */
  code: number
}
