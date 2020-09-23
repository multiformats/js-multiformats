// @ts-check

import * as base32 from './bases/base32.js'
import * as base58 from './bases/base58.js'
import * as sha2 from './hashes/sha2.js'

import raw from './codecs/raw.js'
import json from './codecs/json.js'

import { CID, dag, hasher, digest, varint, bytes } from './index.js'

const bases = { ...base32, ...base58 }
const hashes = { ...sha2 }
const codecs = { raw, json }

export { CID, dag, hasher, digest, varint, bytes, hashes, bases, codecs }
