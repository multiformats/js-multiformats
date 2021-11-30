import assert from 'assert'
import { CID } from 'multiformats/cid'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'
import { base64 } from "multiformats/bases/base64"

// ** PART 1: CREATING A NEW CID **

// Arbitrary input value
const value = { hello: "world"}

// Uint8array representation
const bytes = json.encode(value)

// Hash Uint8array representation
const hash = await sha256.digest(bytes)

// Create CID (default base32)
const cid = CID.create(1, json.code, hash)

cid.code // 512 (JSON codec)
cid.version // 1 
cid.multihash // digest, including code (18 for sha2-256), digest size (32 bytes)
cid.bytes // byte representation

console.log("Example CID: " + cid.toString())
//> 'bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea'



// ** PART 2: MULTIBASE ENCODERS / DECODERS / CODECS **

// Encode CID from part 1 to base64, decode back to base32
const cid_base64 = cid.toString(base64.encoder)
console.log("base64 encoded CID: " + cid_base64)
// 'mAYAEEiCTojlxqRTl6svwqNJRVM2jCcPBxy+7mRTUfGDzy2gViA'

const cid_base32 = CID.parse(cid_base64, base64.decoder)
//> 'bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea'

// test decoded CID against original
assert.strictEqual(cid_base32.toString(), cid.toString(), "Warning: decoded base32 CID does not match original")
console.log("Decoded CID equal to original base32: " + cid_base32.equals(cid)) // alternatively, use more robust built-in function to test equivalence

// Multibase codec exposes both encoder and decoder properties
cid.toString(base64)
CID.parse(cid.toString(base64), base64)



// ** PART 3: CID BASE CONFIGURATIONS **

// CID v1 default encoding is base32
const v1 = CID.parse('bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea')
v1.toString()
//> 'bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea'

// CID v0 default encoding is base58btc
const v0 = CID.parse('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n')
v0.toString()
//> 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
v0.toV1().toString()
//> 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku'


