import { coerce, equals as equalBytes } from '../bytes.js'
import * as varint from '../varint.js'
import type { MultihashDigest } from './interface.js'

/**
 * Creates a multihash digest.
 */
export function create <Code extends number> (code: Code, digest: Uint8Array): Digest<Code, number> {
  const size = digest.byteLength
  const sizeOffset = varint.encodingLength(code)
  const digestOffset = sizeOffset + varint.encodingLength(size)

  const bytes = new Uint8Array(digestOffset + size)
  varint.encodeTo(code, bytes, 0)
  varint.encodeTo(size, bytes, sizeOffset)
  bytes.set(digest, digestOffset)

  return new Digest(code, size, digest, bytes)
}

/**
 * Turns bytes representation of multihash digest into an instance.
 */
export function decode (multihash: Uint8Array): MultihashDigest {
  const bytes = coerce(multihash)
  const [code, sizeOffset] = varint.decode(bytes)
  const [size, digestOffset] = varint.decode(bytes.subarray(sizeOffset))
  const digest = bytes.subarray(sizeOffset + digestOffset)

  if (digest.byteLength !== size) {
    throw new Error('Incorrect length')
  }

  return new Digest(code, size, digest, bytes)
}

export function equals (a: MultihashDigest, b: unknown): b is MultihashDigest {
  if (a === b) {
    return true
  } else {
    const data = b as { code?: unknown, size?: unknown, bytes?: unknown }

    return (
      a.code === data.code &&
      a.size === data.size &&
      data.bytes instanceof Uint8Array &&
      equalBytes(a.bytes, data.bytes)
    )
  }
}

/**
 * Represents a multihash digest which carries information about the
 * hashing algorithm and an actual hash digest.
 */
export class Digest<Code extends number, Size extends number> implements MultihashDigest {
  readonly code: Code
  readonly size: Size
  readonly digest: Uint8Array
  readonly bytes: Uint8Array

  /**
   * Creates a multihash digest.
   */
  constructor (code: Code, size: Size, digest: Uint8Array, bytes: Uint8Array) {
    this.code = code
    this.size = size
    this.digest = digest
    this.bytes = bytes
  }
}

/**
 * Used to check that the passed multihash has the passed code
 */
export function hasCode <T extends number> (digest: MultihashDigest, code: T): digest is MultihashDigest<T> {
  return digest.code === code
}
