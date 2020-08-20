// @ts-check

import cid, { CID } from './cid.js'
import block, { Block } from './block.js'
import * as varint from './varint.js'
import * as bytes from './bytes.js'
import * as hasher from './hashes/hasher.js'
import * as digest from './hashes/digest.js'
import * as codec from './codecs/codec.js'

export { CID, Block, cid, block, hasher, digest, varint, bytes, codec }

/**
 *
 * @param {import('./block/interface').Config} config
 */
export const configure = (config) => {
  return {
    cid: cid(config),
    block: block(config),
    hasher,
    codec,
    digest,
    varint,
    bytes
  }
}

export default configure
