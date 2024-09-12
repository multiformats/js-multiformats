import { base32 } from './bases/base32.js'
import { base36 } from './bases/base36.js'
import { base58btc } from './bases/base58.js'
import { coerce } from './bytes.js'
import * as Digest from './hashes/digest.js'
import * as varint from './varint.js'
import type * as API from './link/interface.js'

// This way TS will also expose all the types from module
export * from './link/interface.js'

export function format <T extends API.Link<unknown, number, number, API.Version>, Prefix extends string> (link: T, base?: API.MultibaseEncoder<Prefix>): API.ToString<T, Prefix> {
  const { bytes, version } = link
  switch (version) {
    case 0:
      return toStringV0(
        bytes,
        baseCache(link),
        base as API.MultibaseEncoder<'z'> ?? base58btc.encoder
      )
    default:
      return toStringV1(
        bytes,
        baseCache(link),
        (base ?? base32.encoder) as API.MultibaseEncoder<Prefix>
      )
  }
}

export function toJSON <Link extends API.UnknownLink> (link: Link): API.LinkJSON<Link> {
  return {
    '/': format(link)
  }
}

export function fromJSON <Link extends API.UnknownLink> (json: API.LinkJSON<Link>): CID<unknown, number, number, API.Version> {
  return CID.parse(json['/'])
}

const cache = new WeakMap<API.UnknownLink, Map<string, string>>()

function baseCache (cid: API.UnknownLink): Map<string, string> {
  const baseCache = cache.get(cid)
  if (baseCache == null) {
    const baseCache = new Map()
    cache.set(cid, baseCache)
    return baseCache
  }
  return baseCache
}

export class CID<Data = unknown, Format extends number = number, Alg extends number = number, Version extends API.Version = API.Version> implements API.Link<Data, Format, Alg, Version> {
  readonly code: Format
  readonly version: Version
  readonly multihash: API.MultihashDigest<Alg>
  readonly bytes: Uint8Array
  readonly '/': Uint8Array

  /**
   * @param version - Version of the CID
   * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param multihash - (Multi)hash of the of the content.
   */
  constructor (version: Version, code: Format, multihash: API.MultihashDigest<Alg>, bytes: Uint8Array) {
    this.code = code
    this.version = version
    this.multihash = multihash
    this.bytes = bytes

    // flag to serializers that this is a CID and
    // should be treated specially
    this['/'] = bytes
  }

  /**
   * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
   * please either use `CID.asCID(cid)` or switch to new signalling mechanism
   *
   * @deprecated
   */
  get asCID (): this {
    return this
  }

  // ArrayBufferView
  get byteOffset (): number {
    return this.bytes.byteOffset
  }

  // ArrayBufferView
  get byteLength (): number {
    return this.bytes.byteLength
  }

  toV0 (): CID<Data, API.DAG_PB, API.SHA_256, 0> {
    switch (this.version) {
      case 0: {
        return this as CID<Data, API.DAG_PB, API.SHA_256, 0>
      }
      case 1: {
        const { code, multihash } = this

        if (code !== DAG_PB_CODE) {
          throw new Error('Cannot convert a non dag-pb CID to CIDv0')
        }

        // sha2-256
        if (multihash.code !== SHA_256_CODE) {
          throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0')
        }

        return (
          CID.createV0(
            multihash as API.MultihashDigest<API.SHA_256>
          )
        )
      }
      default: {
        throw Error(
          `Can not convert CID version ${this.version} to version 0. This is a bug please report`
        )
      }
    }
  }

  toV1 (): CID<Data, Format, Alg, 1> {
    switch (this.version) {
      case 0: {
        const { code, digest } = this.multihash
        const multihash = Digest.create(code, digest)
        return (
          CID.createV1(this.code, multihash)
        )
      }
      case 1: {
        return this as CID<Data, Format, Alg, 1>
      }
      default: {
        throw Error(
          `Can not convert CID version ${this.version} to version 1. This is a bug please report`
        )
      }
    }
  }

  equals (other: unknown): other is CID<Data, Format, Alg, Version> {
    return CID.equals(this, other)
  }

  static equals <Data, Format extends number, Alg extends number, Version extends API.Version>(self: API.Link<Data, Format, Alg, Version>, other: unknown): other is CID {
    const unknown = other as { code?: unknown, version?: unknown, multihash?: unknown }
    return (
      unknown != null &&
      self.code === unknown.code &&
      self.version === unknown.version &&
      Digest.equals(self.multihash, unknown.multihash)
    )
  }

  toString (base?: API.MultibaseEncoder<string>): string {
    return format(this, base)
  }

  toJSON (): API.LinkJSON<this> {
    return { '/': format(this) }
  }

  link (): this {
    return this
  }

  readonly [Symbol.toStringTag] = 'CID';

  // Legacy

  [Symbol.for('nodejs.util.inspect.custom')] (): string {
    return `CID(${this.toString()})`
  }

  /**
   * Takes any input `value` and returns a `CID` instance if it was
   * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
   * it will return value back. If `value` is not instance of this CID
   * class, but is compatible CID it will return new instance of this
   * `CID` class. Otherwise returns null.
   *
   * This allows two different incompatible versions of CID library to
   * co-exist and interop as long as binary interface is compatible.
   */
  static asCID <Data, Format extends number, Alg extends number, Version extends API.Version, U>(input: API.Link<Data, Format, Alg, Version> | U): CID<Data, Format, Alg, Version> | null {
    if (input == null) {
      return null
    }

    const value = input as any
    if (value instanceof CID) {
      // If value is instance of CID then we're all set.
      return value
    } else if ((value['/'] != null && value['/'] === value.bytes) || value.asCID === value) {
      // If value isn't instance of this CID class but `this.asCID === this` or
      // `value['/'] === value.bytes` is true it is CID instance coming from a
      // different implementation (diff version or duplicate). In that case we
      // rebase it to this `CID` implementation so caller is guaranteed to get
      // instance with expected API.
      const { version, code, multihash, bytes } = value
      return new CID(
        version,
        code,
        multihash as API.MultihashDigest<Alg>,
        bytes ?? encodeCID(version, code, multihash.bytes)
      )
    } else if (value[cidSymbol] === true) {
      // If value is a CID from older implementation that used to be tagged via
      // symbol we still rebase it to the this `CID` implementation by
      // delegating that to a constructor.
      const { version, multihash, code } = value
      const digest = Digest.decode(multihash) as API.MultihashDigest<Alg>
      return CID.create(version, code, digest)
    } else {
      // Otherwise value is not a CID (or an incompatible version of it) in
      // which case we return `null`.
      return null
    }
  }

  /**
   * @param version - Version of the CID
   * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param digest - (Multi)hash of the of the content.
   */
  static create <Data, Format extends number, Alg extends number, Version extends API.Version>(version: Version, code: Format, digest: API.MultihashDigest<Alg>): CID<Data, Format, Alg, Version> {
    if (typeof code !== 'number') {
      throw new Error('String codecs are no longer supported')
    }

    if (!(digest.bytes instanceof Uint8Array)) {
      throw new Error('Invalid digest')
    }

    switch (version) {
      case 0: {
        if (code !== DAG_PB_CODE) {
          throw new Error(
            `Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`
          )
        } else {
          return new CID(version, code, digest, digest.bytes)
        }
      }
      case 1: {
        const bytes = encodeCID(version, code, digest.bytes)
        return new CID(version, code, digest, bytes)
      }
      default: {
        throw new Error('Invalid version')
      }
    }
  }

  /**
   * Simplified version of `create` for CIDv0.
   */
  static createV0 <T = unknown>(digest: API.MultihashDigest<typeof SHA_256_CODE>): CID<T, typeof DAG_PB_CODE, typeof SHA_256_CODE, 0> {
    return CID.create(0, DAG_PB_CODE, digest)
  }

  /**
   * Simplified version of `create` for CIDv1.
   *
   * @param code - Content encoding format code.
   * @param digest - Multihash of the content.
   */
  static createV1 <Data, Code extends number, Alg extends number>(code: Code, digest: API.MultihashDigest<Alg>): CID<Data, Code, Alg, 1> {
    return CID.create(1, code, digest)
  }

  /**
   * Decoded a CID from its binary representation. The byte array must contain
   * only the CID with no additional bytes.
   *
   * An error will be thrown if the bytes provided do not contain a valid
   * binary representation of a CID.
   */
  static decode <Data, Code extends number, Alg extends number, Version extends API.Version>(bytes: API.ByteView<API.Link<Data, Code, Alg, Version>>): CID<Data, Code, Alg, Version> {
    const [cid, remainder] = CID.decodeFirst(bytes)
    if (remainder.length !== 0) {
      throw new Error('Incorrect length')
    }
    return cid
  }

  /**
   * Decoded a CID from its binary representation at the beginning of a byte
   * array.
   *
   * Returns an array with the first element containing the CID and the second
   * element containing the remainder of the original byte array. The remainder
   * will be a zero-length byte array if the provided bytes only contained a
   * binary CID representation.
   */
  static decodeFirst <T, C extends number, A extends number, V extends API.Version>(bytes: API.ByteView<API.Link<T, C, A, V>>): [CID<T, C, A, V>, Uint8Array] {
    const specs = CID.inspectBytes(bytes)
    const prefixSize = specs.size - specs.multihashSize
    const multihashBytes = coerce(
      bytes.subarray(prefixSize, prefixSize + specs.multihashSize)
    )
    if (multihashBytes.byteLength !== specs.multihashSize) {
      throw new Error('Incorrect length')
    }
    const digestBytes = multihashBytes.subarray(
      specs.multihashSize - specs.digestSize
    )
    const digest = new Digest.Digest(
      specs.multihashCode,
      specs.digestSize,
      digestBytes,
      multihashBytes
    )
    const cid =
      specs.version === 0
        ? CID.createV0(digest as API.MultihashDigest<API.SHA_256>)
        : CID.createV1(specs.codec, digest)
    return [cid as CID<T, C, A, V>, bytes.subarray(specs.size)]
  }

  /**
   * Inspect the initial bytes of a CID to determine its properties.
   *
   * Involves decoding up to 4 varints. Typically this will require only 4 to 6
   * bytes but for larger multicodec code values and larger multihash digest
   * lengths these varints can be quite large. It is recommended that at least
   * 10 bytes be made available in the `initialBytes` argument for a complete
   * inspection.
   */
  static inspectBytes <T, C extends number, A extends number, V extends API.Version>(initialBytes: API.ByteView<API.Link<T, C, A, V>>): { version: V, codec: C, multihashCode: A, digestSize: number, multihashSize: number, size: number } {
    let offset = 0
    const next = (): number => {
      const [i, length] = varint.decode(initialBytes.subarray(offset))
      offset += length
      return i
    }

    let version = next() as V
    let codec = DAG_PB_CODE as C
    if (version as number === 18) {
      // CIDv0
      version = 0 as V
      offset = 0
    } else {
      codec = next() as C
    }

    if (version !== 0 && version !== 1) {
      throw new RangeError(`Invalid CID version ${version}`)
    }

    const prefixSize = offset
    const multihashCode = next() as A // multihash code
    const digestSize = next() // multihash length
    const size = offset + digestSize
    const multihashSize = size - prefixSize

    return { version, codec, multihashCode, digestSize, multihashSize, size }
  }

  /**
   * Takes cid in a string representation and creates an instance. If `base`
   * decoder is not provided will use a default from the configuration. It will
   * throw an error if encoding of the CID is not compatible with supplied (or
   * a default decoder).
   */
  static parse <Prefix extends string, Data, Code extends number, Alg extends number, Version extends API.Version>(source: API.ToString<API.Link<Data, Code, Alg, Version>, Prefix>, base?: API.MultibaseDecoder<Prefix>): CID<Data, Code, Alg, Version> {
    const [prefix, bytes] = parseCIDtoBytes(source, base)

    const cid = CID.decode(bytes)

    if (cid.version === 0 && source[0] !== 'Q') {
      throw Error('Version 0 CID string must not include multibase prefix')
    }

    // Cache string representation to avoid computing it on `this.toString()`
    baseCache(cid).set(prefix, source)

    return cid
  }
}

function parseCIDtoBytes <Prefix extends string, Data, Code extends number, Alg extends number, Version extends API.Version> (source: API.ToString<API.Link<Data, Code, Alg, Version>, Prefix>, base?: API.MultibaseDecoder<Prefix>): [Prefix, API.ByteView<API.Link<Data, Code, Alg, Version>>] {
  switch (source[0]) {
    // CIDv0 is parsed differently
    case 'Q': {
      const decoder = base ?? base58btc
      return [
        base58btc.prefix as Prefix,
        decoder.decode(`${base58btc.prefix}${source}`)
      ]
    }
    case base58btc.prefix: {
      const decoder = base ?? base58btc
      return [base58btc.prefix as Prefix, decoder.decode(source)]
    }
    case base32.prefix: {
      const decoder = base ?? base32
      return [base32.prefix as Prefix, decoder.decode(source)]
    }
    case base36.prefix: {
      const decoder = base ?? base36
      return [base36.prefix as Prefix, decoder.decode(source)]
    }
    default: {
      if (base == null) {
        throw Error(
          'To parse non base32, base36 or base58btc encoded CID multibase decoder must be provided'
        )
      }
      return [source[0] as Prefix, base.decode(source)]
    }
  }
}

function toStringV0 (bytes: Uint8Array, cache: Map<string, string>, base: API.MultibaseEncoder<'z'>): string {
  const { prefix } = base
  if (prefix !== base58btc.prefix) {
    throw Error(`Cannot string encode V0 in ${base.name} encoding`)
  }

  const cid = cache.get(prefix)
  if (cid == null) {
    const cid = base.encode(bytes).slice(1)
    cache.set(prefix, cid)
    return cid
  } else {
    return cid
  }
}

function toStringV1 <Prefix extends string> (bytes: Uint8Array, cache: Map<string, string>, base: API.MultibaseEncoder<Prefix>): string {
  const { prefix } = base
  const cid = cache.get(prefix)
  if (cid == null) {
    const cid = base.encode(bytes)
    cache.set(prefix, cid)
    return cid
  } else {
    return cid
  }
}

const DAG_PB_CODE = 0x70
const SHA_256_CODE = 0x12

function encodeCID (version: API.Version, code: number, multihash: Uint8Array): Uint8Array {
  const codeOffset = varint.encodingLength(version)
  const hashOffset = codeOffset + varint.encodingLength(code)
  const bytes = new Uint8Array(hashOffset + multihash.byteLength)
  varint.encodeTo(version, bytes, 0)
  varint.encodeTo(code, bytes, codeOffset)
  bytes.set(multihash, hashOffset)
  return bytes
}

const cidSymbol = Symbol.for('@ipld/js-cid/CID')
