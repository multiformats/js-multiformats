// @ts-check

import { notImplemented } from './bases/base.js'
import * as base32 from './bases/base32.js'
import * as sha2 from './hashes/sha2.js'

import raw from './codecs/raw.js'
import json from './codecs/json.js'

import configure from './index.js'

const bases = { ...base32 }
const hashes = { ...sha2 }
const codecs = { raw, json }

const { cid, CID, block, Block, hasher, digest, varint, bytes } = configure({
  base: bases.base32,
  base58btc: notImplemented({ name: 'base58btc', prefix: 'z' }),
  hasher: hashes.sha256
})

export { cid, CID, block, Block, hasher, digest, varint, bytes, hashes, bases, codecs }
