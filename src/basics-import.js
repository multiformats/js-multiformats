
import { CID, Block, hasher, digest, varint, bytes, hashes, codecs, bases as _bases } from './basics.js'
import * as base64 from './bases/base64-import.js'

const bases = { ..._bases, ...base64 }
export { CID, Block, hasher, digest, varint, bytes, hashes, codecs, bases }
