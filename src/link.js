// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from "./link/interface.js"
import * as CID from './cid.js'
// This way TS will also expose all the types from module
export * from './link/interface.js'
// Linter can see that API is used in types.
// eslint-disable-next-line
import * as CIDAPI from './cid/interface.js'

// eslint-disable-next-line
const SHA_256_CODE = 0x12

/**
 * @template {unknown} Data
 * @template {number} Code
 * @template {number} Alg
 * @template {API.Version} Ver
 * @param {CIDAPI.CID<Data, Code, Alg, Ver>} cid
 * @returns {API.Link<Data, Code, Alg, Ver>}
 */
export function asLink (cid) {
  /** @type {API.Link<Data, Code, Alg, Ver>} */
  const link = {
    ...cid,
    toJSON () {
      return {
        code: cid.code,
        version: cid.version,
        hash: cid.multihash.bytes
      }
    },
    link () {
      return link
    },
    toV1 () {
      return asLink(CID.toV1(cid))
    },
    /**
     * @param {unknown} other
     * @returns {other is API.Link<Data, Code, Alg, Ver>}
     */
    equals (other) {
      return CID.equals(cid, other)
    },
    toString (base) {
      if (cid.version === 0 && base != null && base.name !== 'base58btc') {
        throw new Error(`Cannot string encode V0 in ${base.name} encoding`)
      }

      return CID.format(cid, base).toString()
    }
  }

  return link
}

/**
 * Simplified version of `create` for CIDv0.
 *
 * @param {API.MultihashDigest<typeof SHA_256_CODE>} digest - Multihash.
 * @returns {API.LegacyLink}
 */
export const createLegacy = digest => asLink(CID.createV0(digest))

/**
 * Simplified version of `create` for CIDv1.
 *
 * @template {unknown} Data
 * @template {number} Code
 * @template {number} Alg
 * @param {Code} code - Content encoding format code.
 * @param {API.MultihashDigest<Alg>} digest - Miltihash of the content.
 * @returns {API.Link<Data, Code, Alg>}
 */
export const create = (code, digest) => asLink(CID.createV1(code, digest))

/**
 * Type predicate returns true if value is the link.
 *
 * @template {API.Link<unknown, number, number, 0|1>} L
 * @param {unknown|L} value
 * @returns {value is L & CID}
 */
export const isLink = value =>
  value != null && /** @type {{asCID: unknown}} */ (value).asCID === value

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
 * @returns {API.Link<Data, Code, Alg, Ver>}
 */
export const parse = (source, base) => asLink(CID.parse(source, base))

export const format = CID.format

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
 * @returns {API.Link<Data, Code, Alg, Ver>}
 */
export const decode = bytes => asLink(CID.decode(bytes))
