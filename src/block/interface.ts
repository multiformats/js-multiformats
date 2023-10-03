/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
/* eslint-disable no-use-before-define */

import type { CID } from '../cid.js'
import type { Link, Version } from '../link/interface.js'

/**
 * A byte-encoded representation of some type of `Data`.
 *
 * A `ByteView` is essentially a `Uint8Array` that's been "tagged" with
 * a `Data` type parameter indicating the type of encoded data.
 *
 * For example, a `ByteView<{ hello: "world" }>` is a `Uint8Array` containing a
 * binary representation of a `{hello: "world"}`.
 */
export interface ByteView<Data> extends Uint8Array, Phantom<Data> {}

declare const Marker: unique symbol

/**
 * A utility type to retain an unused type parameter `T`.
 * Similar to [phantom type parameters in Rust](https://doc.rust-lang.org/rust-by-example/generics/phantom.html).
 *
 * Capturing unused type parameters allows us to define "nominal types," which
 * TypeScript does not natively support. Nominal types in turn allow us to capture
 * semantics not represented in the actual type structure, without requiring us to define
 * new classes or pay additional runtime costs.
 *
 * For a concrete example, see {@link ByteView}, which extends the `Uint8Array` type to capture
 * type information about the structure of the data encoded into the array.
 */
export interface Phantom<T> {
  // This field can not be represented because field name is non-existent
  // unique symbol. But given that field is optional any object will valid
  // type constraint.
  [Marker]?: T
}

/**
 * Represents an IPLD block (including its CID) that can be decoded to data of
 * type `T`.
 *
 * @template T - Logical type of the data encoded in the block
 * @template C - multicodec code corresponding to codec used to encode the block
 * @template A - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template V - CID version
 */
export interface Block<
  T = unknown,
  C extends number = number,
  A extends number = number,
  V extends Version = 1
> {
  bytes: ByteView<T>
  cid: Link<T, C, A, V>
}

export type BlockCursorView<T extends unknown = unknown> =
  | { value: T, remaining?: undefined }
  | { value: CID, remaining: string }

export interface BlockView<
  T = unknown,
  C extends number = number,
  A extends number = number,
  V extends Version = 1
> extends Block<T, C, A, V> {
  cid: CID<T, C, A, V>
  value: T

  links(): Iterable<[string, CID]>
  tree(): Iterable<string>
  get(path: string): BlockCursorView<unknown>
}
