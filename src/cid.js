// @ts-check

import * as varint from './varint.js'
import * as Digest from './hashes/digest.js'

/**
 * @typedef {import('./hashes/interface').MultihashDigest} MultihashDigest
 * @typedef {import('./bases/interface').BaseEncoder} BaseEncoder
 * @typedef {import('./bases/interface').BaseDecoder} BaseDecoder
 */

/**
 * @template Prefix
 * @typedef {import('./bases/interface').MultibaseEncoder<Prefix>} MultibaseEncoder
 */

/**
 * @typedef {import('./cid/interface').Config} Config
 */

/**
 * @implements {Config}
 */
export class CID {
  /**
   * @param {0|1} version
   * @param {number} code
   * @param {MultihashDigest} multihash
   * @param {Uint8Array} bytes
   * @param {Config} config
   *
   */
  constructor (version, code, multihash, bytes, { base, base58btc }) {
    this.code = code
    this.version = version
    this.multihash = multihash
    this.bytes = bytes

    this.base = base
    this.base58btc = base58btc

    // ArrayBufferView
    this.byteOffset = bytes.byteOffset
    this.byteLength = bytes.byteLength

    // Circular reference
    /** @private */
    this.asCID = this
    /**
     * @type {Map<string, string>}
     * @private
     */
    this._baseCache = new Map()

    // Configure private properties
    Object.defineProperties(this, {
      byteOffset: hidden,
      byteLength: hidden,

      code: readonly,
      version: readonly,
      multihash: readonly,
      bytes: readonly,

      _baseCache: hidden,
      asCID: hidden
    })
  }

  /**
   * @returns {CID}
   */
  toV0 () {
    switch (this.version) {
      case 0: {
        return this
      }
      default: {
        if (this.code !== DAG_PB_CODE) {
          throw new Error('Cannot convert a non dag-pb CID to CIDv0')
        }

        const { code, digest } = this.multihash

        // sha2-256
        if (code !== SHA_256_CODE) {
          throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0')
        }

        return createV0(Digest.decodeImplicitSha256(digest), this)
      }
    }
  }

  /**
   * @returns {CID}
   */
  toV1 () {
    switch (this.version) {
      case 0: {
        const { code, digest } = this.multihash
        const multihash = Digest.create(code, digest)
        return createV1(this.code, multihash, this)
      }
      case 1: {
        return this
      }
      default: {
        throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`)
      }
    }
  }

  /**
   * @param {any} other
   */
  equals (other) {
    return other &&
        this.code === other.code &&
        this.version === other.version &&
        Digest.equals(this.multihash, other.multihash)
  }

  /**
   * @param {MultibaseEncoder<any>} [base]
   */
  toString (base) {
    const { bytes, version, _baseCache } = this
    switch (version) {
      case 0:
        return toStringV0(bytes, _baseCache, base || this.base58btc.encoder)
      default:
        return toStringV1(bytes, _baseCache, base || this.base.encoder)
    }
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
    return 'CID(' + this.toString() + ')'
  }

  // Deprecated

  static isCID (value) {
    deprecate(/^0\.0/, IS_CID_DEPRECATION)
    return !!(value && (value[cidSymbol] || value.asCID === value))
  }

  get toBaseEncodedString () {
    throw new Error('Deprecated, use .toString()')
  }

  get codec () {
    throw new Error('"codec" property is deprecated, use integer "code" property instead')
  }

  get buffer () {
    throw new Error('Deprecated .buffer property, use .bytes to get Uint8Array instead')
  }

  get multibaseName () {
    throw new Error('"multibaseName" property is deprecated')
  }

  get prefix () {
    throw new Error('"prefix" property is deprecated')
  }
}

class CIDAPI {
  /**
   * Returns API for working with CIDs.
   * @param {Config} config
   */
  constructor (config) {
    this.config = config
    this.CID = CID
  }

  create (version, code, digest) {
    return create(version, code, digest, this.config)
  }

  parse (cid) {
    return parse(cid, this.config)
  }

  decode (cid) {
    return decode(cid, this.config)
  }

  asCID (input) {
    return asCID(input, this.config)
  }

  /**
   * Creates a new CID from either string, binary or an object representation.
   * Throws an error if provided `value` is not a valid CID.
   *
   * @param {CID|string|Uint8Array} value
   * @returns {CID}
   */
  from (value) {
    if (typeof value === 'string') {
      return parse(value, this.config)
    } else if (value instanceof Uint8Array) {
      return decode(value, this.config)
    } else {
      const cid = asCID(value, this.config)
      if (cid) {
        // If we got the same CID back we create a copy.
        if (cid === value) {
          return new CID(cid.version, cid.code, cid.multihash, cid.bytes, this.config)
        } else {
          return cid
        }
      } else {
        throw new TypeError(`Can not create CID from given value ${value}`)
      }
    }
  }
}

/**
 *
 * @param {number} version - Version of the CID
 * @param {number} code - Code of the codec content is encoded in.
 * @param {MultihashDigest} digest - (Multi)hash of the of the content.
 * @param {Config} config - Base encoding that will be used for toString
 * serialization. If omitted configured default will be used.
 * @returns {CID}
 */
export const create = (version, code, digest, config) => {
  switch (version) {
    case 0: {
      if (code !== DAG_PB_CODE) {
        throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`)
      } else {
        return new CID(version, code, digest, digest.bytes, config)
      }
    }
    case 1: {
      const bytes = encodeCID(version, code, digest.bytes)
      return new CID(version, code, digest, bytes, config)
    }
    default: {
      throw new Error('Invalid version')
    }
  }
}

/**
   * Simplified version of `create` for CIDv0.
   * @param {MultihashDigest} digest - Multihash.
   * @param {Config} config
   */
export const createV0 = (digest, config) => create(0, DAG_PB_CODE, digest, config)

/**
 * Simplified version of `create` for CIDv1.
 * @template {number} Code
 * @param {Code} code - Content encoding format code.
 * @param {MultihashDigest} digest - Miltihash of the content.
 * @param {Config} config - Base encoding used of the serialziation. If
 * omitted configured default is used.
 * @returns {CID}
 */
export const createV1 = (code, digest, config) => create(1, code, digest, config)

/**
 * Takes cid in a string representation and creates an instance. If `base`
 * decoder is not provided will use a default from the configuration. It will
 * throw an error if encoding of the CID is not compatible with supplied (or
 * a default decoder).
 *
 * @param {string} source
 * @param {Config} config
 */
export const parse = (source, config) => {
  const { base, base58btc } = config
  const [name, bytes] = source[0] === 'Q'
    ? [BASE_58_BTC, base58btc.decoder.decode(`${BASE_58_BTC_PREFIX}{source}`)]
    : [base.encoder.name, base.decoder.decode(source)]

  const cid = decode(bytes, config)
  // Cache string representation to avoid computing it on `this.toString()`
  // @ts-ignore - Can't access private
  cid._baseCache.set(name, source)

  return cid
}

/**
   * Takes cid in a binary representation and a `base` encoder that will be used
   * for default cid serialization.
   *
   * Throws if supplied base encoder is incompatible (CIDv0 is only compatible
   * with `base58btc` encoder).
   * @param {Uint8Array} cid
   * @param {Config} config
   */
export const decode = (cid, config) => {
  const [version, offset] = varint.decode(cid)
  switch (version) {
    // CIDv0
    case 18: {
      const multihash = Digest.decodeImplicitSha256(cid)
      return createV0(multihash, config)
    }
    // CIDv1
    case 1: {
      const [code, length] = varint.decode(cid.subarray(offset))
      const digest = Digest.decode(cid.subarray(offset + length))
      return createV1(code, digest, config)
    }
    default: {
      throw new RangeError(`Invalid CID version ${version}`)
    }
  }
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
     * @param {any} value
     * @param {Config} config
     * @returns {CID|null}
     */
export const asCID = (value, config) => {
  if (value instanceof CID) {
    // If value is instance of CID then we're all set.
    return value
  } else if (value != null && value.asCID === value) {
    // If value isn't instance of this CID class but `this.asCID === this` is
    // true it is CID instance coming from a different implemnetation (diff
    // version or duplicate). In that case we rebase it to this `CID`
    // implemnetation so caller is guaranteed to get instance with expected
    // API.
    const { version, code, multihash, bytes, config } = value
    return new CID(version, code, multihash, bytes, config)
  } else if (value != null && value[cidSymbol] === true) {
    // If value is a CID from older implementation that used to be tagged via
    // symbol we still rebase it to the this `CID` implementation by
    // delegating that to a constructor.
    const { version, multihash, code } = value
    const digest = version === 0
      ? Digest.decodeImplicitSha256(multihash)
      : Digest.decode(multihash)
    return create(version, code, digest, config)
  } else {
    // Otherwise value is not a CID (or an incompatible version of it) in
    // which case we return `null`.
    return null
  }
}
/**
 *
 * @param {Uint8Array} bytes
 * @param {Map<string, string>} cache
 * @param {MultibaseEncoder<'z'>} base
 */
const toStringV0 = (bytes, cache, base) => {
  const cid = cache.get(BASE_58_BTC)
  if (cid == null) {
    const multibase = base.encode(bytes)
    if (multibase[0] !== BASE_58_BTC_PREFIX) {
      throw Error('CIDv0 can only be encoded to base58btc encoding, invalid')
    }
    const cid = multibase.slice(1)
    cache.set(BASE_58_BTC, cid)
    return cid
  } else {
    return cid
  }
}

/**
 * @template Prefix
 * @param {Uint8Array} bytes
 * @param {Map<string, string>} cache
 * @param {MultibaseEncoder<Prefix>} base
 */
const toStringV1 = (bytes, cache, base) => {
  const cid = cache.get(base.name)
  if (cid == null) {
    const cid = base.encode(bytes)
    cache.set(base.name, cid)
    return cid
  } else {
    return cid
  }
}

/**
 * @param {Config} config
 */
export const configure = config => new CIDAPI(config)

export default configure

const BASE_58_BTC = 'base58btc'
const BASE_58_BTC_PREFIX = 'z'
const DAG_PB_CODE = 0x70
const SHA_256_CODE = 0x12

/**
     *
 * @param {number} version
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
