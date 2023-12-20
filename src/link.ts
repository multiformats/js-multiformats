import { CID, format, toJSON, fromJSON } from './cid.js'
import type * as API from './link/interface.js'
// This way TS will also expose all the types from module
export * from './link/interface.js'

const DAG_PB_CODE = 0x70
// eslint-disable-next-line
const SHA_256_CODE = 0x12

/**
 * Simplified version of `create` for CIDv0.
 */
export function createLegacy (digest: API.MultihashDigest<typeof SHA_256_CODE>): API.LegacyLink {
  return CID.create(0, DAG_PB_CODE, digest)
}

/**
 * Simplified version of `create` for CIDv1.
 *
 * @param code - Content encoding format code.
 * @param digest - Miltihash of the content.
 */
export function create <Data, Code extends number, Alg extends number> (code: Code, digest: API.MultihashDigest<Alg>): API.Link<Data, Code, Alg> {
  return CID.create(1, code, digest)
}

/**
 * Type predicate returns true if value is the link.
 */
export function isLink <L extends API.Link<unknown, number, number, 0 | 1>> (value: unknown | L): value is L & CID {
  if (value == null) {
    return false
  }

  const withSlash = value as { '/'?: Uint8Array, bytes: Uint8Array }

  if (withSlash['/'] != null && withSlash['/'] === withSlash.bytes) {
    return true
  }

  const withAsCID = value as { 'asCID'?: unknown }

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
 */
export function parse <Prefix extends string, Data, Code extends number, Alg extends number, Ver extends API.Version> (source: API.ToString<API.Link<Data, Code, Alg, Ver>, Prefix>, base?: API.MultibaseDecoder<Prefix>): API.Link<Data, Code, Alg, Ver> {
  return CID.parse(source, base)
}

export { format, toJSON, fromJSON }

/**
 * Decoded a CID from its binary representation. The byte array must contain
 * only the CID with no additional bytes.
 *
 * An error will be thrown if the bytes provided do not contain a valid
 * binary representation of a CID.
 */
export function decode <Data, Code extends number, Alg extends number, Ver extends API.Version> (bytes: API.ByteView<API.Link<Data, Code, Alg, Ver>>): API.Link<Data, Code, Alg, Ver> {
  return CID.decode(bytes)
}
