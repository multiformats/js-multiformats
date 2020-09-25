// @ts-check

import * as base64 from './bases/base64-browser.js'
import { CID, hasher, digest, varint, bytes, hashes, codecs, bases as _bases } from './basics.js'

const bases = { ..._bases, ...base64 }

export { CID, hasher, digest, varint, bytes, hashes, codecs, bases }
