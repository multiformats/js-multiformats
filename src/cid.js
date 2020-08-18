import * as Bytes from './bytes.js'

const property = (value, { writable = false, enumerable = true, configurable = false } = {}) => ({
  value,
  writable,
  enumerable,
  configurable
})

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

/**
 * @param {import('./index').Multiformats} multiformats
 */
export default multiformats => {
  const { multibase, varint, multihash } = multiformats

  /**
   * @param {number} version
   * @param {number} codec
   * @param {Uint8Array} multihash
   * @returns {Uint8Array}
   */
  const encodeCID = (version, codec, multihash) => {
    const versionBytes = varint.encode(version)
    const codecBytes = varint.encode(codec)
    const bytes = new Uint8Array(versionBytes.byteLength + codecBytes.byteLength + multihash.byteLength)
    bytes.set(versionBytes, 0)
    bytes.set(codecBytes, versionBytes.byteLength)
    bytes.set(multihash, versionBytes.byteLength + codecBytes.byteLength)
    return bytes
  }

  /**
   * Takes `Uint8Array` representation of `CID` and returns
   * `[version, codec, multihash]`. Throws error if bytes passed do not
   * correspond to vaild `CID`.
   * @param {Uint8Array} bytes
   * @returns {[number, number, Uint8Array]}
   */
  const decodeCID = (bytes) => {
    const [version, offset] = varint.decode(bytes)
    switch (version) {
      // CIDv0
      case 18: {
        return [0, 0x70, bytes]
      }
      // CIDv1
      case 1: {
        const [code, length] = varint.decode(bytes.subarray(offset))
        return [1, code, decodeMultihash(bytes.subarray(offset + length))]
      }
      default: {
        throw new RangeError(`Invalid CID version ${version}`)
      }
    }
  }

  const cidSymbol = Symbol.for('@ipld/js-cid/CID')

  /**
   * Create CID from the string encoded CID.
   * @param {string} string
   * @returns {CID}
   */
  const fromString = (string) => {
    switch (string[0]) {
      // V0
      case 'Q': {
        const cid = new CID(multibase.get('base58btc').decode(string))
        cid._baseCache.set('base58btc', string)
        return cid
      }
      default: {
        // CID v1
        const cid = new CID(multibase.decode(string))
        cid._baseCache.set(multibase.encoding(string).name, string)
        return cid
      }
    }
  }

  /**
   * Takes a hashCID multihash and validates the digest. Returns it back if
   * all good otherwise throws error.
   * @param {Uint8Array} hash
   * @returns {Uint8Array}
   */
  const decodeMultihash = (hash) => {
    const { digest, length } = multihash.decode(hash)
    if (digest.length !== length) {
      throw new Error('Given multihash has incorrect length')
    }

    return hash
  }

  /**
   * @implements {ArrayBufferView}
   */
  class CID {
    /**
     * Creates new CID from the given value that is either CID, string or an
     * Uint8Array.
     * @param {CID|string|Uint8Array} value
     */
    static from (value) {
      if (typeof value === 'string') {
        return fromString(value)
      } else if (value instanceof Uint8Array) {
        return new CID(value)
      } else {
        const cid = CID.asCID(value)
        if (cid) {
          // If we got the same CID back we create a copy.
          if (cid === value) {
            return new CID(cid.bytes)
          } else {
            return cid
          }
        } else {
          throw new TypeError(`Can not create CID from given value ${value}`)
        }
      }
    }

    /**
     * Creates new CID with a given version, codec and a multihash.
     * @param {number} version
     * @param {number} code
     * @param {Uint8Array} multihash
     */
    static create (version, code, multihash) {
      if (typeof code !== 'number') {
        throw new Error('String codecs are no longer supported')
      }

      switch (version) {
        case 0: {
          if (code !== 112) {
            throw new Error('Version 0 CID must be 112 codec (dag-cbor)')
          } else {
            return new CID(multihash)
          }
        }
        case 1: {
          // TODO: Figure out why we check digest here but not in v 0
          return new CID(encodeCID(version, code, decodeMultihash(multihash)))
        }
        default: {
          throw new Error('Invalid version')
        }
      }
    }

    /**
     *
     * @param {ArrayBuffer|Uint8Array} buffer
     * @param {number} [byteOffset=0]
     * @param {number} [byteLength=buffer.byteLength]
     */
    constructor (buffer, byteOffset = 0, byteLength = buffer.byteLength) {
      const bytes = buffer instanceof Uint8Array
        ? Bytes.coerce(buffer) // Just in case it's a node Buffer
        : new Uint8Array(buffer, byteOffset, byteLength)

      const [version, code, multihash] = decodeCID(bytes)
      Object.defineProperties(this, {
        // ArrayBufferView
        byteOffset: property(bytes.byteOffset, { enumerable: false }),
        byteLength: property(bytes.byteLength, { enumerable: false }),

        // CID fields
        version: property(version),
        code: property(code),
        multihash: property(multihash),
        asCID: property(this),

        // Legacy
        bytes: property(bytes, { enumerable: false }),

        // Internal
        _baseCache: property(new Map(), { enumerable: false })
      })
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

    toV0 () {
      if (this.code !== 0x70 /* dag-pb */) {
        throw new Error('Cannot convert a non dag-pb CID to CIDv0')
      }

      const { name } = multihash.decode(this.multihash)

      if (name !== 'sha2-256') {
        throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0')
      }

      return CID.create(0, this.code, this.multihash)
    }

    toV1 () {
      return CID.create(1, this.code, this.multihash)
    }

    get toBaseEncodedString () {
      throw new Error('Deprecated, use .toString()')
    }

    [Symbol.for('nodejs.util.inspect.custom')] () {
      return 'CID(' + this.toString() + ')'
    }

    toString (base) {
      const { version, bytes } = this
      if (version === 0) {
        if (base && base !== 'base58btc') {
          throw new Error(`Cannot string encode V0 in ${base} encoding`)
        }
        const { encode } = multibase.get('base58btc')
        return encode(bytes)
      }

      base = base || 'base32'
      const { _baseCache } = this
      const string = _baseCache.get(base)
      if (string == null) {
        const string = multibase.encode(bytes, base)
        _baseCache.set(base, string)
        return string
      } else {
        return string
      }
    }

    toJSON () {
      return {
        code: this.code,
        version: this.version,
        hash: this.multihash
      }
    }

    equals (other) {
      return this.code === other.code &&
        this.version === other.version &&
        Bytes.equals(this.multihash, other.multihash)
    }

    get [Symbol.toStringTag] () {
      return 'CID'
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
     * @returns {CID|null}
     */
    static asCID (value) {
      // If value is instance of CID then we're all set.
      if (value instanceof CID) {
        return value
      // If value isn't instance of this CID class but `this.asCID === this` is
      // true it is CID instance coming from a different implemnetation (diff
      // version or duplicate). In that case we rebase it to this `CID`
      // implemnetation so caller is guaranteed to get instance with expected
      // API.
      } else if (value != null && value.asCID === value) {
        const { version, code, multihash } = value
        return CID.create(version, code, multihash)
      // If value is a CID from older implementation that used to be tagged via
      // symbol we still rebase it to the this `CID` implementation by
      // delegating that to a constructor.
      } else if (value != null && value[cidSymbol] === true) {
        const { version, multihash } = value
        const code = value.code /* c8 ignore next */ || multiformats.get(value.codec).code
        return new CID(encodeCID(version, code, multihash))
      // Otherwise value is not a CID (or an incompatible version of it) in
      // which case we return `null`.
      } else {
        return null
      }
    }

    static isCID (value) {
      deprecate(/^0\.0/, IS_CID_DEPRECATION)
      return !!(value && (value[cidSymbol] || value.asCID === value))
    }
  }

  return CID
}
