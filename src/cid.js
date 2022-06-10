import * as varint from './varint.js'
import * as Digest from './hashes/digest.js'
import { base58btc } from './bases/base58.js'
import { base32 } from './bases/base32.js'
import { coerce } from './bytes.js'
// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from './cid/interface.js'

// This way TS will also expose all the types from module
export * from './cid/interface.js'

/**
 * @template {number} Format
 * @template {number} Alg
 * @template {API.CIDVersion} Version
 * @template {unknown} U
 * @param {API.CID<Format, Alg, Version>|U} input
 * @returns {API.CID<Format, Alg, Version>|null}
 */
export const asCID = (input) => {
  const value = /** @type {any} */(input)
  if (value instanceof CID) {
    // If value is instance of CID then we're all set.
    return value
  } else if (value != null && value.asCID === value) {
    // If value isn't instance of this CID class but `this.asCID === this` is
    // true it is CID instance coming from a different implemnetation (diff
    // version or duplicate). In that case we rebase it to this `CID`
    // implemnetation so caller is guaranteed to get instance with expected
    // API.
    const { version, code, multihash, bytes } = value
    return new CID(
      version,
      code,
      /** @type {API.MultihashDigest<Alg>} */ (multihash),
      bytes || encodeCID(version, code, multihash.bytes)
    )
  } else if (value != null && value[cidSymbol] === true) {
    // If value is a CID from older implementation that used to be tagged via
    // symbol we still rebase it to the this `CID` implementation by
    // delegating that to a constructor.
    const { version, multihash, code } = value
    const digest =
      /** @type {API.MultihashDigest<Alg>} */
      (Digest.decode(multihash))
    return create(version, code, digest)
  } else {
    // Otherwise value is not a CID (or an incompatible version of it) in
    // which case we return `null`.
    return null
  }
}

/**
 * @template {number} Format
 * @template {number} Alg
 * @template {API.CIDVersion} Version
 * @param {Version} version - Version of the CID
 * @param {Format} code - Code of the codec content is encoded in.
 * @param {API.MultihashDigest<Alg>} digest - (Multi)hash of the of the content.
 * @returns {API.CID<Format, Alg, Version>}
 */
export const create = (version, code, digest) => {
  if (typeof code !== 'number') {
    throw new Error('String codecs are no longer supported')
  }

  switch (version) {
    case 0: {
      if (code !== DAG_PB_CODE) {
        throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`)
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
 * @param {API.MultihashDigest<typeof SHA_256_CODE>} digest - Multihash.
 * @returns {API.CIDv0}
 */
export const createV0 = (digest) => create(0, DAG_PB_CODE, digest)

/**
 * Simplified version of `create` for CIDv1.
 * @template {number} Code
 * @template {number} Alg
 * @param {Code} code - Content encoding format code.
 * @param {API.MultihashDigest<Alg>} digest - Miltihash of the content.
 * @returns {API.CIDv1<Code, Alg>}
 */
export const createV1 = (code, digest) => create(1, code, digest)

/**
 * Decoded a CID from its binary representation. The byte array must contain
 * only the CID with no additional bytes.
 *
 * An error will be thrown if the bytes provided do not contain a valid
 * binary representation of a CID.
 *
 * @param {Uint8Array} bytes
 * @returns {API.CID}
 */
export const decode = (bytes) => {
  const [cid, remainder] = decodeFirst(bytes)
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
 * @param {Uint8Array} bytes
 * @returns {[API.CID, Uint8Array]}
 */
export const decodeFirst = (bytes) => {
  const specs = inspectBytes(bytes)
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
  const cid = specs.version === 0
    ? createV0(/** @type {API.MultihashDigest<API.SHA_256>} */(digest))
    : createV1(specs.codec, digest)
  return [cid, bytes.subarray(specs.size)]
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
   * @param {Uint8Array} initialBytes
   * @returns {{ version:API.CIDVersion, codec:number, multihashCode:number, digestSize:number, multihashSize:number, size:number }}
   */
export const inspectBytes = (initialBytes) => {
  let offset = 0
  const next = () => {
    const [i, length] = varint.decode(initialBytes.subarray(offset))
    offset += length
    return i
  }

  let version = next()
  let codec = DAG_PB_CODE
  if (version === 18) {
    // CIDv0
    version = 0
    offset = 0
  } else if (version === 1) {
    codec = next()
  }

  if (version !== 0 && version !== 1) {
    throw new RangeError(`Invalid CID version ${version}`)
  }

  const prefixSize = offset
  const multihashCode = next() // multihash code
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
 * @param {string} source
 * @param {API.MultibaseDecoder<Prefix>} [base]
 * @returns {API.CID}
 */
export const parse = (source, base) => {
  const [prefix, bytes] = parseCIDtoBytes(source, base)

  const cid = decode(bytes)

  // Cache string representation to avoid computing it on `this.toString()`
  baseCache(cid).set(prefix, source)

  return cid
}

/**
 * @template {number} Format
 * @template {number} Alg
 * @template {API.CIDVersion} Version
 * @param {API.CID<Format, Alg, Version>} cid
 * @param {any} other
 * @returns {other is cid}
 */
export const equals = (cid, other) => {
  return (
    other &&
    cid.code === other.code &&
    cid.version === other.version &&
    Digest.equals(cid.multihash, other.multihash)
  )
}

/**
 * @param {API.CID} cid
 * @param {API.MultibaseEncoder<string>} [base]
 * @returns {string}
 */
export const toString = (cid, base) => {
  const { bytes, version } = cid
  switch (version) {
    case 0:
      return toStringV0(
        bytes,
        baseCache(cid),
        /** @type {API.MultibaseEncoder<"z">} */ (base) || base58btc.encoder
      )
    default:
      return toStringV1(bytes, baseCache(cid), base || base32.encoder)
  }
}

/**  @type {WeakMap<API.CID, Map<string, string>>} */
const cache = new WeakMap()

/**
 * @param {API.CID} cid
 * @returns {Map<string, string>}
 */
const baseCache = (cid) => {
  const baseCache = cache.get(cid)
  if (baseCache == null) {
    const baseCache = new Map()
    cache.set(cid, baseCache)
    return baseCache
  }
  return baseCache
}

/**
 * @template {number} [Format=number]
 * @template {number} [Alg=number]
 * @template {API.CIDVersion} [Version=API.CIDVersion]
 * @implements {API.CID<Format, Alg, Version>}
 */

export class CID {
  /**
   * @param {Version} version
   * @param {Format} code
   * @param {API.MultihashDigest<Alg>} multihash
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

    // ArrayBufferView
    /** @readonly */
    this.byteOffset = bytes.byteOffset
    /** @readonly */
    this.byteLength = bytes.byteLength

    // Circular reference
    /** @readonly */
    this.asCID = this

    // Configure private properties
    Object.defineProperties(this, {
      byteOffset: hidden,
      byteLength: hidden,

      code: readonly,
      version: readonly,
      multihash: readonly,
      bytes: readonly,

      asCID: hidden
    })
  }

  /**
   * @returns {CID<API.DAG_PB, API.SHA_256, 0>}
   */
  toV0 () {
    switch (this.version) {
      case 0: {
        return /** @type {CID<API.DAG_PB, API.SHA_256, 0>} */ (this)
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

        return /** @type {CID<API.DAG_PB, API.SHA_256, 0>} */ (
          createV0(/** @type {API.MultihashDigest<API.SHA_256>} */ (multihash))
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
   * @returns {CID<Format, Alg, 1>}
   */
  toV1 () {
    switch (this.version) {
      case 0: {
        const { code, digest } = this.multihash
        const multihash = Digest.create(code, digest)
        return /** @type {CID<Format, Alg, 1>} */ (
          createV1(this.code, multihash)
        )
      }
      case 1: {
        return /** @type {CID<Format, Alg, 1>} */ (this)
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
   * @returns {other is CID<Format, Alg, Version>}
   */
  equals (other) {
    return equals(this, other)
  }

  /**
   * @param {API.MultibaseEncoder<string>} [base]
   * @returns {string}
   */
  toString (base) {
    return toString(this, base)
  }

  toJSON () {
    return {
      code: this.code,
      version: this.version,
      hash: this.multihash.bytes
    }
  }

  get [Symbol.toStringTag] () {
    return 'CID'
  }

  // Legacy

  [Symbol.for('nodejs.util.inspect.custom')] () {
    return `CID(${this.toString()})`
  }

  // Deprecated

  /**
   * @param {any} value
   * @returns {value is CID}
   */
  static isCID (value) {
    deprecate(/^0\.0/, IS_CID_DEPRECATION)
    return !!(value && (value[cidSymbol] || value.asCID === value))
  }

  get toBaseEncodedString () {
    throw new Error('Deprecated, use .toString()')
  }

  get codec () {
    throw new Error(
      '"codec" property is deprecated, use integer "code" property instead'
    )
  }

  get buffer () {
    throw new Error(
      'Deprecated .buffer property, use .bytes to get Uint8Array instead'
    )
  }

  get multibaseName () {
    throw new Error('"multibaseName" property is deprecated')
  }

  get prefix () {
    throw new Error('"prefix" property is deprecated')
  }

  /**
   * @template {number} C
   * @template {number} A
   * @template {API.CIDVersion} V
   * @template {unknown} U
   * @param {API.CID<C, A, V>|U} value
   * @returns {CID<C, A, V>|null}
   */
  static asCID (value) {
    return /** @type {CID<C, A, V>|null} */ (asCID(value))
  }

  /**
   * @template {number} Format
   * @template {number} Alg
   * @template {API.CIDVersion} Version
   * @param {Version} version - Version of the CID
   * @param {Format} code - Code of the codec content is encoded in.
   * @param {API.MultihashDigest<Alg>} digest - (Multi)hash of the of the content.
   */
  static create (version, code, digest) {
    return /** @type {CID<Format, Alg, Version>} */ (
      create(version, code, digest)
    )
  }

  /**
   * Simplified version of `create` for CIDv0.
   * @param {API.MultihashDigest<typeof SHA_256_CODE>} digest - Multihash.
   */
  static createV0 (digest) {
    return CID.create(0, DAG_PB_CODE, digest)
  }

  /**
   * Simplified version of `create` for CIDv1.
   * @template {number} Code
   * @template {number} Alg
   * @param {Code} code - Content encoding format code.
   * @param {API.MultihashDigest<Alg>} digest - Miltihash of the content.
   */
  static createV1 (code, digest) {
    return CID.create(1, code, digest)
  }

  /**
   * @param {Uint8Array} bytes
   */

  static decode (bytes) {
    return /** @type {CID} */ (decode(bytes))
  }

  /**
   * @param {Uint8Array} bytes
   */
  static decodeFirst (bytes) {
    return /** @type {[CID, Uint8Array]} */ (decodeFirst(bytes))
  }

  /**
   * @param {Uint8Array} initialBytes
   */
  static inspectBytes (initialBytes) {
    return inspectBytes(initialBytes)
  }

  /**
   * @template {string} Prefix
   * @param {string} source
   * @param {API.MultibaseDecoder<Prefix>} [base]
   */
  static parse (source, base) {
    return /** @type {CID} */ (parse(source, base))
  }
}

/**
 * @template {string} Prefix
 * @param {string} source
 * @param {API.MultibaseDecoder<Prefix>} [base]
 * @returns {[string, Uint8Array]}
 */
const parseCIDtoBytes = (source, base) => {
  switch (source[0]) {
    // CIDv0 is parsed differently
    case 'Q': {
      const decoder = base || base58btc
      return [base58btc.prefix, decoder.decode(`${base58btc.prefix}${source}`)]
    }
    case base58btc.prefix: {
      const decoder = base || base58btc
      return [base58btc.prefix, decoder.decode(source)]
    }
    case base32.prefix: {
      const decoder = base || base32
      return [base32.prefix, decoder.decode(source)]
    }
    default: {
      if (base == null) {
        throw Error('To parse non base32 or base58btc encoded CID multibase decoder must be provided')
      }
      return [source[0], base.decode(source)]
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
 * @param {API.CIDVersion} version
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
const readonly = { writable: false, configurable: false, enumerable: true }
const hidden = { writable: false, enumerable: false, configurable: false }

// ESM does not support importing package.json where this version info
// should come from. To workaround it version is copied here.
const version = '0.0.0-dev'
// Start throwing exceptions on major version bump
/**
 *
 * @param {RegExp} range
 * @param {string} message
 */
const deprecate = (range, message) => {
  if (range.test(version)) {
    console.warn(message)
  /* c8 ignore next 3 */
  } else {
    throw new Error(message)
  }
}

const IS_CID_DEPRECATION =
`CID.isCID(v) is deprecated and will be removed in the next major release.
Following code pattern:

if (CID.isCID(value)) {
  doSomethingWithCID(value)
}

Is replaced with:

const cid = CID.asCID(value)
if (cid) {
  // Make sure to use cid instead of value
  doSomethingWithCID(cid)
}
`
