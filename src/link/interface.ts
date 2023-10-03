/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
/* eslint-disable no-use-before-define */

import type { MultibaseEncoder, MultibaseDecoder, Multibase } from '../bases/interface.js'
import type { Phantom, ByteView } from '../block/interface.js'
import type { MultihashDigest } from '../hashes/interface.js'

export type { MultihashDigest, MultibaseEncoder, MultibaseDecoder }
export type Version = 0 | 1

export type DAG_PB = 0x70
export type SHA_256 = 0x12

/**
 * Represents an IPLD link to a specific data of type `T`.
 *
 * @template T - Logical type of the data being linked to.
 * @template C - multicodec code corresponding to a codec linked data is encoded with
 * @template A - multicodec code corresponding to the hashing algorithm of the CID
 * @template V - CID version
 */
export interface Link<
  Data extends unknown = unknown,
  Format extends number = number,
  Alg extends number = number,
  V extends Version = 1
  > extends Phantom<Data> {
  readonly version: V
  readonly code: Format
  readonly multihash: MultihashDigest<Alg>

  readonly byteOffset: number
  readonly byteLength: number
  readonly bytes: ByteView<Link<Data, Format, Alg, V>>

  equals(other: unknown): other is Link<Data, Format, Alg, Version>

  toString<Prefix extends string>(base?: MultibaseEncoder<Prefix>): ToString<Link<Data, Format, Alg, Version>, Prefix>
  link(): Link<Data, Format, Alg, V>

  toV1(): Link<Data, Format, Alg, 1>
}

export interface LinkJSON<T extends UnknownLink = UnknownLink> {
  '/': ToString<T>
}

export interface LegacyLink<T extends unknown = unknown> extends Link<T, DAG_PB, SHA_256, 0> {
}

export type UnknownLink =
  | LegacyLink<unknown>
  | Link<unknown, number, number, Version>

export type ToString<T, Prefix extends string = string> = Multibase<Prefix> & Phantom<T>

export type { ByteView }
