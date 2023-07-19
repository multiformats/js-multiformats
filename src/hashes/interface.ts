// # Multihash
import type { MulticodecCode } from '../block/interface.js'

/**
 * Represents a multihash digest which carries information about the
 * hashing algorithm and an actual hash digest.
 */
// Note: In the current version there is no first class multihash
// representation (plain Uint8Array is used instead) instead there seems to be
// a bunch of places that parse it to extract (code, digest, size). By creating
// this first class representation we avoid reparsing and things generally fit
// really nicely.
export interface MultihashDigest<Code extends MulticodecCode = MulticodecCode, Size extends number = number> {
  /**
   * Code of the multihash
   */
  code: Code

  /**
   * Raw digest (without a hashing algorithm info)
   */
  digest: Uint8Array

  /**
   * byte length of the `this.digest`
   */
  size: Size

  /**
   * Binary representation of this multihash digest.
   */
  bytes: Uint8Array
}

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 */
export interface MultihashHasher<Code extends MulticodecCode = MulticodecCode> {
  /**
   * Takes binary `input` and returns it (multi) hash digest. Return value is
   * either promise of a digest or a digest. This way general use can `await`
   * while performance critical code may asses return value to decide whether
   * await is needed.
   *
   * @param {Uint8Array} input
   */
  digest: (input: Uint8Array) => Promise<MultihashDigest<Code>> | MultihashDigest<Code>

  /**
   * Name of the multihash
   */
  name: string

  /**
   * Code of the multihash
   */
  code: Code
}

/**
 * Sync variant of `MultihashHasher` that refines return type of the `digest`
 * to `MultihashDigest`. It is subtype of `MultihashHasher` so implementations
 * of this interface can be passed anywhere `MultihashHasher` is expected,
 * allowing consumer to either `await` or check the return type to decide
 * whether to await or proceed with return value.
 *
 * `SyncMultihashHasher` is useful in certain APIs where async hashing would be
 * impractical e.g. implementation of Hash Array Mapped Trie (HAMT).
 */
export interface SyncMultihashHasher<Code extends MulticodecCode = MulticodecCode> extends MultihashHasher<Code> {
  digest: (input: Uint8Array) => MultihashDigest<Code>
}

/**
 * Incremental variant of the `MultihashHasher` that can be used to compute
 * digest of the payloads that would be impractical or impossible to load all
 * into a memory.
 */
export interface IncrementalMultihashHasher<
  Code extends MulticodecCode,
  Size extends number,
  Digest = MultihashDigest<Code, Size>
> {
  /**
   * Size of the digest this hasher produces.
   */
  size: Size

  /**
   * Code of the multihash
   */
  code: Code

  /**
   * Name of the multihash
   */
  name: string

  /**
   * Number of bytes that were consumed.
   */
  count(): bigint

  /**
   * Returns multihash digest of the bytes written so far. Should not have
   * side-effects, meaning you should be able to write some more bytes and
   * call `digest` again to get the digest for all the bytes written from
   * creation (or from reset)
   */
  digest(): Digest

  /**
   * Computes the digest of the given input and writes it into the provided
   * `output` at given `offset`. The `offset` is optional and if omitted is
   * implicitly `0`. The optional `asMultihash` whith is implicitly `true`,
   * can be use to control whether multihash prefix is written, if `false`
   * only the raw digest writtend omitting the prefix.
   */
  digestInto(output: Uint8Array, offset?: number, asMultihash?: boolean): this

  /**
   * Writes bytes to be digested.
   */
  write(bytes: Uint8Array): this

  /**
   * Resets this hasher to its initial state. Can be used to recycle this
   * instance. It resets `count` and and discards all the bytes that were
   * written prior.
   */
  reset(): this
}

