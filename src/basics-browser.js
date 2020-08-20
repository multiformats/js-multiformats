// @ts-check

import * as base64 from './bases/base64-browser.js'
import { cid, CID, block, Block, hasher, digest, varint, bytes, hashes, codecs, bases as _bases } from './basics.js'

const bases = { ..._bases, ...base64 }

export { cid, CID, block, Block, hasher, digest, varint, bytes, hashes, codecs, bases }
