// @ts-check

import * as base32 from './bases/base32.js'
import * as base58 from './bases/base58.js'
import * as sha2 from './hashes/sha2.js'

import * as raw from './codecs/raw.js'
import * as json from './codecs/json.js'

import { CID, hasher, digest, varint, bytes } from './index.js'

const bases = { ...base32, ...base58 }
const hashes = { ...sha2 }
const codecs = { raw, json }

export { CID, hasher, digest, varint, bytes, hashes, bases, codecs }
