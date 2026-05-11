import * as base10 from './bases/base10.ts'
import * as base16 from './bases/base16.ts'
import * as base2 from './bases/base2.ts'
import * as base256emoji from './bases/base256emoji.ts'
import * as base32 from './bases/base32.ts'
import * as base36 from './bases/base36.ts'
import * as base45 from './bases/base45.ts'
import * as base58 from './bases/base58.ts'
import * as base64 from './bases/base64.ts'
import * as base8 from './bases/base8.ts'
import * as identityBase from './bases/identity.ts'
import * as json from './codecs/json.ts'
import * as raw from './codecs/raw.ts'
import * as identity from './hashes/identity.ts'
import * as sha2 from './hashes/sha2.ts'
import { CID, hasher, digest, varint, bytes } from './index.ts'

export const bases = { ...identityBase, ...base2, ...base8, ...base10, ...base16, ...base32, ...base36, ...base45, ...base58, ...base64, ...base256emoji }
export const hashes = { ...sha2, ...identity }
export const codecs = { raw, json }

export { CID, hasher, digest, varint, bytes }
