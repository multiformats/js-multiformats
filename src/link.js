// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from "./link/interface.js"
import { CID, format, toJSON, fromJSON } from './cid.js'
// This way TS will also expose all the types from module
export * from './link/interface.js'

const DAG_PB_CODE = 0x70
// eslint-disable-next-line
const SHA_256_CODE = 0x12

/**
 * Simplified version of `create` for CIDv0.
 *
 * @param {API.MultihashDigest<typeof SHA_256_CODE>} digest - Multihash.
 * @returns {API.LegacyLink}
 */
export const createLegacy = digest => CID.create(0, DAG_PB_CODE, digest)

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
export const create = (code, digest) => CID.create(1, code, digest)

/**
 * Type predicate returns true if value is the link.
 *
 * @template {API.Link<unknown, number, number, 0|1>} L
 * @param {unknown|L} value
 * @returns {value is L & CID}
 */
export const isLink = value => {
  if (value == null) {
    return false
  }

  const withSlash = /** @type {{'/'?: Uint8Array, bytes: Uint8Array}} */ (value)

  if (withSlash['/'] != null && withSlash['/'] === withSlash.bytes) {
    return true
  }

  const withAsCID = /** @type {{'asCID'?: unknown}} */ (value)

  if (withAsCID.asCID === value) {
    return true
  }

  return false
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
 * @returns {API.Link<Data, Code, Alg, Ver>}
 */
export const parse = (source, base) => CID.parse(source, base)

export { format, toJSON, fromJSON }

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
export const decode = bytes => CID.decode(bytes)
