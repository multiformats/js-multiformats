/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
/* eslint-disable no-use-before-define */
import type { MultihashDigest } from '../hashes/interface'
import type { MultibaseEncoder, MultibaseDecoder } from '../bases/interface'
import type { Phantom } from '../block/interface'
export type { CID as CIDView } from '../cid'

export type { MultihashDigest, MultibaseEncoder, MultibaseDecoder }
export type CIDVersion = 0 | 1

export type DAG_PB = 0x70
export type SHA_256 = 0x12

export interface CID<
  Format extends number = number,
  Alg extends number = number,
  Version extends CIDVersion = CIDVersion
> {
  readonly version: Version
  readonly code: Format
  readonly multihash: MultihashDigest<Alg>

  readonly byteOffset: number
  readonly byteLength: number
  readonly bytes: Uint8Array

  readonly asCID: this

  equals(other: unknown): other is CID<Format, Alg, Version>

  toString(base?: MultibaseEncoder<string>): string
  toJSON(): { version: Version, code:Format, hash:Uint8Array }

  toV0(): CIDv0
  toV1(): CIDv1
}

/**
 * Represents an IPLD link to a specific data of type `T`.
 *
 * @template T - Logical type of the data being linked to.
 * @template C - multicodec code corresponding to a codec linked data is encoded with
 * @template A - multicodec code corresponding to the hashing algorithm of the CID
 * @template V - CID version
 */
export interface Link<
  T extends unknown = unknown,
  C extends number = number,
  A extends number = number,
  V extends CIDVersion = 1
> extends CID<C, A, V>, Phantom<T> {
}

export interface CIDv0 extends CID<DAG_PB, SHA_256, 0> {
  readonly version: 0
}

export interface CIDv1<
  Format extends number = number,
  Alg extends number = number
> extends CID<Format, Alg, 1> {
  readonly version: 1
}

// Export interface with different name because
// cid.js will shadow `CID` interface with a class
export type { CID as CIDType }
