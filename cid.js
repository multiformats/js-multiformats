'use strict'

const { Buffer } = require('buffer')
const withIs = require('class-is')

module.exports = multiformats => {
  const { multibase, varint } = multiformats
  const parse = buff => {
    const [ code, length ] = varint.decode(buff)
    return [ code, buff.slice(length) ]
  }
  const encode = (version, codec, multihash) => {
    return Buffer.concat([varint.encode(version), varint.encode(codec), multihash])
  }
  class CID {
    constructor (cid, ...args) {
      if (_CID.isCID(cid)) return cid
      if (args.length > 0) {
        this.version = cid
        if (typeof args[0] !== 'number') throw new Error('String codecs are no longer supported')
        this.code = args.shift()
        if (this.version === 0 && this.code !== 112) {
          throw new Error('Version 0 CID must be 112 codec (dag-cbor)')
        }
        this.multihash = args.shift()
        if (args.length) throw new Error('No longer supported, cannot specify base encoding in instantiation')
        if (this.version === 0) this.buffer = this.multihash
        else this.buffer = encode(this.version, this.multicodec, this.multihash)
        return
      }
      if (typeof cid === 'string') {
        if (cid.startsWith('Q')) {
          this.version = 0
          this.code = 0x70
          const { decode } = multibase.get('base58btc')
          this.multihash = decode(cid)
          this.buffer = this.multihash
          return
        }
        cid = multibase.decode(cid)
      }
      this.buffer = cid
      let code
      ;[ code, cid ] = parse(cid)
      this.version = code
      ;[ code, cid ] = parse(cid)
      this.code = code
      this.multihash = cid
      this._baseCache = new Map()
    }

    get codec () {
      throw new Error('"codec" property is deprecated, use integer "code" property instead')
    }
    get multibaseName () {
      throw new Error('"multibaseName" property is deprecated')
    }

    oldConstructor (version, codec, multihash, multibaseName) {
      if (_CID.isCID(version)) {
        // version is an exising CID instance
        const cid = version
        this.version = cid.version
        this.codec = cid.codec
        this.multihash = Buffer.from(cid.multihash)
        // Default guard for when a CID < 0.7 is passed with no multibaseName
        this.multibaseName = cid.multibaseName || (cid.version === 0 ? 'base58btc' : 'base32')
        return
      }

      if (typeof version === 'string') {
        // e.g. 'base32' or false
        const baseName = multibase.isEncoded(version)
        if (baseName) {
          // version is a CID String encoded with multibase, so v1
          const cid = multibase.decode(version)
          this.version = parseInt(cid.slice(0, 1).toString('hex'), 16)
          this.codec = multicodec.getCodec(cid.slice(1))
          this.multihash = multicodec.rmPrefix(cid.slice(1))
          this.multibaseName = baseName
        } else {
          // version is a base58btc string multihash, so v0
          this.version = 0
          this.codec = 'dag-pb'
          this.multihash = mh.fromB58String(version)
          this.multibaseName = 'base58btc'
        }
        CID.validateCID(this)
        Object.defineProperty(this, 'string', { value: version })
        return
      }

      if (Buffer.isBuffer(version)) {
        const firstByte = version.slice(0, 1)
        const v = parseInt(firstByte.toString('hex'), 16)
        if (v === 1) {
          // version is a CID buffer
          const cid = version
          this.version = v
          this.codec = multicodec.getCodec(cid.slice(1))
          this.multihash = multicodec.rmPrefix(cid.slice(1))
          this.multibaseName = 'base32'
        } else {
          // version is a raw multihash buffer, so v0
          this.version = 0
          this.codec = 'dag-pb'
          this.multihash = version
          this.multibaseName = 'base58btc'
        }
        CID.validateCID(this)
        return
      }

      // otherwise, assemble the CID from the parameters
      this.version = version
      this.codec = codec
      this.multihash = multihash
      this.multibaseName = multibaseName || (version === 0 ? 'base58btc' : 'base32')
      CID.validateCID(this)
    }
    get prefix () {
      throw new Error('"prefix" property is deprecated')
    }
    get oldPrefix () {
      return Buffer.concat([
        Buffer.from(`0${this.version}`, 'hex'),
        multicodec.getCodeVarint(this.codec),
        mh.prefix(this.multihash)
      ])
    }

    toV0 () {
      if (this.multicodec !== 0x70 /* dag-pb */) {
        throw new Error('Cannot convert a non dag-pb CID to CIDv0')
      }

      const { name, length } = multihash.decode(this.multihash)

      if (name !== 'sha2-256') {
        throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0')
      }

      if (length !== 32) {
        throw new Error('Cannot convert non 32 byte multihash CID to CIDv0')
      }

      return new _CID(0, this.code, this.multihash)
    }

    toV1 () {
      return new _CID(1, this.code, this.multihash)
    }

    get toBaseEncodedString () {
      throw new Error('Deprecated, use .toString()')
    }
    oldToBaseEncodedString (base = this.multibaseName) {
      if (this.string && base === this.multibaseName) {
        return this.string
      }
      let str = null
      if (this.version === 0) {
        if (base !== 'base58btc') {
          throw new Error('not supported with CIDv0, to support different bases, please migrate the instance do CIDv1, you can do that through cid.toV1()')
        }
        str = mh.toB58String(this.multihash)
      } else if (this.version === 1) {
        str = multibase.encode(base, this.buffer).toString()
      } else {
        throw new Error('unsupported version')
      }
      if (base === this.multibaseName) {
        // cache the string value
        Object.defineProperty(this, 'string', { value: str })
      }
      return str
    }

    [Symbol.for('nodejs.util.inspect.custom')] () {
      return 'CID(' + this.toString() + ')'
    }

    toString (base) {
      if (this.version === 0) {
        if (base && base !== 'base58btc') {
          throw new Error(`Cannot string encode V0 in ${base} encoding`)
        }
        const { encode } = multibase.get('base58btc')
        return encode(this.buffer, 'base58btc')
      }
      if (!base) base = 'base32'
      if (this._baseCache.has(base)) return this._baseCache.get(base)
      this._baseCache.set(base, multibase.encode(this.buffer, base))
      return this._baseCache.get(base)
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
        this.multihash.equals(other.multihash)
    }
  }

  const _CID = withIs(CID, {
    className: 'CID',
    symbolName: '@ipld/js-cid/CID'
  })
  _CID.validateCID = other => {
    const errorMsg = CIDUtil.checkCIDComponents(other)
    if (errorMsg) {
      throw new Error(errorMsg)
    }
  }

  return _CID
}
