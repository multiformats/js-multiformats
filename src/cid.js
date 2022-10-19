import * as varint from './varint.js'
import * as Digest from './hashes/digest.js'
import { base58btc } from './bases/base58.js'
import { base32 } from './bases/base32.js'
import { coerce } from './bytes.js'
// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from "./link/interface.js"

// This way TS will also expose all the types from module
export * from './link/interface.js'

/**
 * @template {API.Link<unknown, number, number, API.Version>} T
 * @template {string} Prefix
 * @param {T} link
 * @param {API.MultibaseEncoder<Prefix>} [base]
 * @returns {API.ToString<T, Prefix>}
 */
export const format = (link, base) => {
  const { bytes, version } = link
  switch (version) {
    case 0:
      return toStringV0(
        bytes,
        baseCache(link),
        /** @type {API.MultibaseEncoder<"z">} */ (base) || base58btc.encoder
      )
    default:
      return toStringV1(
        bytes,
        baseCache(link),
        /** @type {API.MultibaseEncoder<Prefix>} */ (base || base32.encoder)
      )
  }
}

/** @type {WeakMap<API.UnknownLink, Map<string, string>>} */
const cache = new WeakMap()

/**
 * @param {API.UnknownLink} cid
 * @returns {Map<string, string>}
 */
const baseCache = cid => {
  const baseCache = cache.get(cid)
  if (baseCache == null) {
    const baseCache = new Map()
    cache.set(cid, baseCache)
    return baseCache
  }
  return baseCache
}

/**
 * @template {unknown} [Data=unknown]
 * @template {number} [Format=number]
 * @template {number} [Alg=number]
 * @template {API.Version} [Version=API.Version]
 * @implements {API.Link<Data, Format, Alg, Version>}
 */

export class CID {
  /**
   * @param {Version} version - Version of the CID
   * @param {Format} code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param {API.MultihashDigest<Alg>} multihash - (Multi)hash of the of the content.
   * @param {Uint8Array} bytes
   *
   */
  constructor (version, code, multihash, bytes) {
    /** @readonly */
    this.code = code
    /** @readonly */
    this.version = version
    /** @readonly */
    this.multihash = multihash
    /** @readonly */
    this.bytes = bytes

    // flag to serializers that this is a CID and
    // should be treated specially
    /** @readonly */
    this['/'] = bytes
  }

  /**
   * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
   * please either use `CID.asCID(cid)` or switch to new signalling mechanism
   *
   * @deprecated
   */
  get asCID () {
    return this
  }

  // ArrayBufferView
  get byteOffset () {
    return this.bytes.byteOffset
  }

  // ArrayBufferView
  get byteLength () {
    return this.bytes.byteLength
  }

  /**
   * @returns {CID<Data, API.DAG_PB, API.SHA_256, 0>}
   */
  toV0 () {
    switch (this.version) {
      case 0: {
        return /** @type {CID<Data, API.DAG_PB, API.SHA_256, 0>} */ (this)
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

        return /** @type {CID<Data, API.DAG_PB, API.SHA_256, 0>} */ (
          CID.createV0(
            /** @type {API.MultihashDigest<API.SHA_256>} */ (multihash)
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

  /**
   * @returns {CID<Data, Format, Alg, 1>}
   */
  toV1 () {
    switch (this.version) {
      case 0: {
        const { code, digest } = this.multihash
        const multihash = Digest.create(code, digest)
        return /** @type {CID<Data, Format, Alg, 1>} */ (
          CID.createV1(this.code, multihash)
        )
      }
      case 1: {
        return /** @type {CID<Data, Format, Alg, 1>} */ (this)
      }
      default: {
        throw Error(
          `Can not convert CID version ${this.version} to version 1. This is a bug please report`
        )
      }
    }
  }

  /**
   * @param {unknown} other
   * @returns {other is CID<Data, Format, Alg, Version>}
   */
  equals (other) {
    return CID.equals(this, other)
  }

  /**
   * @template {unknown} Data
   * @template {number} Format
   * @template {number} Alg
   * @template {API.Version} Version
   * @param {API.Link<Data, Format, Alg, Version>} self
   * @param {unknown} other
   * @returns {other is CID}
   */
  static equals (self, other) {
    const unknown =
      /** @type {{code?:unknown, version?:unknown, multihash?:unknown}} */ (
        other
      )
    return (
      unknown &&
      self.code === unknown.code &&
      self.version === unknown.version &&
      Digest.equals(self.multihash, unknown.multihash)
    )
  }

  /**
   * @param {API.MultibaseEncoder<string>} [base]
   * @returns {string}
   */
  toString (base) {
    return format(this, base)
  }

  toJSON () {
    return {
      code: this.code,
      version: this.version,
      hash: this.multihash.bytes
    }
  }

  link () {
    return this
  }

  get [Symbol.toStringTag] () {
    return 'CID'
  }

  // Legacy

  [Symbol.for('nodejs.util.inspect.custom')] () {
    return `CID(${this.toString()})`
  }

  /**
   * Takes any input `value` and returns a `CID` instance if it was
   * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
   * it will return value back. If `value` is not instance of this CID
   * class, but is compatible CID it will return new instance of this
   * `CID` class. Otherwise returs null.
   *
   * This allows two different incompatible versions of CID library to
   * co-exist and interop as long as binary interface is compatible.
   *
   * @template {unknown} Data
   * @template {number} Format
   * @template {number} Alg
   * @template {API.Version} Version
   * @template {unknown} U
   * @param {API.Link<Data, Format, Alg, Version>|U} input
   * @returns {CID<Data, Format, Alg, Version>|null}
   */
  static asCID (input) {
    if (input == null) {
      return null
    }

    const value = /** @type {any} */ (input)
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
        /** @type {API.MultihashDigest<Alg>} */ (multihash),
        bytes || encodeCID(version, code, multihash.bytes)
      )
    } else if (value[cidSymbol] === true) {
      // If value is a CID from older implementation that used to be tagged via
      // symbol we still rebase it to the this `CID` implementation by
      // delegating that to a constructor.
      const { version, multihash, code } = value
      const digest =
        /** @type {API.MultihashDigest<Alg>} */
        (Digest.decode(multihash))
      return CID.create(version, code, digest)
    } else {
      // Otherwise value is not a CID (or an incompatible version of it) in
      // which case we return `null`.
      return null
    }
  }

  /**
   *
   * @template {unknown} Data
   * @template {number} Format
   * @template {number} Alg
   * @template {API.Version} Version
   * @param {Version} version - Version of the CID
   * @param {Format} code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param {API.MultihashDigest<Alg>} digest - (Multi)hash of the of the content.
   * @returns {CID<Data, Format, Alg, Version>}
   */
  static create (version, code, digest) {
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
   *
   * @template {unknown} [T=unknown]
   * @param {API.MultihashDigest<typeof SHA_256_CODE>} digest - Multihash.
   * @returns {CID<T, typeof DAG_PB_CODE, typeof SHA_256_CODE, 0>}
   */
  static createV0 (digest) {
    return CID.create(0, DAG_PB_CODE, digest)
  }

  /**
   * Simplified version of `create` for CIDv1.
   *
   * @template {unknown} Data
   * @template {number} Code
   * @template {number} Alg
   * @param {Code} code - Content encoding format code.
   * @param {API.MultihashDigest<Alg>} digest - Miltihash of the content.
   * @returns {CID<Data, Code, Alg, 1>}
   */
  static createV1 (code, digest) {
    return CID.create(1, code, digest)
  }

  /**
   * Decoded a CID from its binary representation. The byte array must contain
   * only the CID with no additional bytes.
   *
   * An error will be thrown if the bytes provided do not contain a valid
   * binary representation of a CID.
   *
   * @template {unknown} Data
   * @template {number} Code
   * @template {number} Alg
   * @template {API.Version} Ver
   * @param {API.ByteView<API.Link<Data, Code, Alg, Ver>>} bytes
   * @returns {CID<Data, Code, Alg, Ver>}
   */
  static decode (bytes) {
    const [cid, remainder] = CID.decodeFirst(bytes)
    if (remainder.length) {
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
   *
   * @template {unknown} T
   * @template {number} C
   * @template {number} A
   * @template {API.Version} V
   * @param {API.ByteView<API.Link<T, C, A, V>>} bytes
   * @returns {[CID<T, C, A, V>, Uint8Array]}
   */
  static decodeFirst (bytes) {
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
        ? CID.createV0(/** @type {API.MultihashDigest<API.SHA_256>} */ (digest))
        : CID.createV1(specs.codec, digest)
    return [/** @type {CID<T, C, A, V>} */(cid), bytes.subarray(specs.size)]
  }

  /**
   * Inspect the initial bytes of a CID to determine its properties.
   *
   * Involves decoding up to 4 varints. Typically this will require only 4 to 6
   * bytes but for larger multicodec code values and larger multihash digest
   * lengths these varints can be quite large. It is recommended that at least
   * 10 bytes be made available in the `initialBytes` argument for a complete
   * inspection.
   *
   * @template {unknown} T
   * @template {number} C
   * @template {number} A
   * @template {API.Version} V
   * @param {API.ByteView<API.Link<T, C, A, V>>} initialBytes
   * @returns {{ version:V, codec:C, multihashCode:A, digestSize:number, multihashSize:number, size:number }}
   */
  static inspectBytes (initialBytes) {
    let offset = 0
    const next = () => {
      const [i, length] = varint.decode(initialBytes.subarray(offset))
      offset += length
      return i
    }

    let version = /** @type {V} */ (next())
    let codec = /** @type {C} */ (DAG_PB_CODE)
    if (/** @type {number} */(version) === 18) {
      // CIDv0
      version = /** @type {V} */ (0)
      offset = 0
    } else {
      codec = /** @type {C} */ (next())
    }

    if (version !== 0 && version !== 1) {
      throw new RangeError(`Invalid CID version ${version}`)
    }

    const prefixSize = offset
    const multihashCode = /** @type {A} */ (next()) // multihash code
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
   *
   * @template {string} Prefix
   * @template {unknown} Data
   * @template {number} Code
   * @template {number} Alg
   * @template {API.Version} Ver
   * @param {API.ToString<API.Link<Data, Code, Alg, Ver>, Prefix>} source
   * @param {API.MultibaseDecoder<Prefix>} [base]
   * @returns {CID<Data, Code, Alg, Ver>}
   */
  static parse (source, base) {
    const [prefix, bytes] = parseCIDtoBytes(source, base)

    const cid = CID.decode(bytes)

    // Cache string representation to avoid computing it on `this.toString()`
    baseCache(cid).set(prefix, source)

    return cid
  }
}

/**
 * @template {string} Prefix
 * @template {unknown} Data
 * @template {number} Code
 * @template {number} Alg
 * @template {API.Version} Ver
 * @param {API.ToString<API.Link<Data, Code, Alg, Ver>, Prefix>} source
 * @param {API.MultibaseDecoder<Prefix>} [base]
 * @returns {[Prefix, API.ByteView<API.Link<Data, Code, Alg, Ver>>]}
 */
const parseCIDtoBytes = (source, base) => {
  switch (source[0]) {
    // CIDv0 is parsed differently
    case 'Q': {
      const decoder = base || base58btc
      return [
        /** @type {Prefix} */ (base58btc.prefix),
        decoder.decode(`${base58btc.prefix}${source}`)
      ]
    }
    case base58btc.prefix: {
      const decoder = base || base58btc
      return [/** @type {Prefix} */(base58btc.prefix), decoder.decode(source)]
    }
    case base32.prefix: {
      const decoder = base || base32
      return [/** @type {Prefix} */(base32.prefix), decoder.decode(source)]
    }
    default: {
      if (base == null) {
        throw Error(
          'To parse non base32 or base58btc encoded CID multibase decoder must be provided'
        )
      }
      return [/** @type {Prefix} */(source[0]), base.decode(source)]
    }
  }
}

/**
 *
 * @param {Uint8Array} bytes
 * @param {Map<string, string>} cache
 * @param {API.MultibaseEncoder<'z'>} base
 */
const toStringV0 = (bytes, cache, base) => {
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

/**
 * @template {string} Prefix
 * @param {Uint8Array} bytes
 * @param {Map<string, string>} cache
 * @param {API.MultibaseEncoder<Prefix>} base
 */
const toStringV1 = (bytes, cache, base) => {
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

/**
 * @param {API.Version} version
 * @param {number} code
 * @param {Uint8Array} multihash
 * @returns {Uint8Array}
 */
const encodeCID = (version, code, multihash) => {
  const codeOffset = varint.encodingLength(version)
  const hashOffset = codeOffset + varint.encodingLength(code)
  const bytes = new Uint8Array(hashOffset + multihash.byteLength)
  varint.encodeTo(version, bytes, 0)
  varint.encodeTo(code, bytes, codeOffset)
  bytes.set(multihash, hashOffset)
  return bytes
}

const cidSymbol = Symbol.for('@ipld/js-cid/CID')
