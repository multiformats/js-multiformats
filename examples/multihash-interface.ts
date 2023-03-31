import { CID } from 'multiformats/cid'
import crypto from 'crypto'
import * as json from 'multiformats/codecs/json'
import * as hasher from 'multiformats/hashes/hasher'

// ** Example 1: sha2-256 hasher **

const sha256 = hasher.from({
  // As per multiformats table
  // https://github.com/multiformats/multicodec/blob/master/table.csv#L9
  name: 'sha2-256',
  code: 0x12,

  encode: (input) => new Uint8Array(crypto.createHash('sha256').update(input).digest())
})

async function run1 () {
  const hash = await sha256.digest(json.encode({ hello: 'world' }))
  const cid = CID.create(1, json.code, hash)

  console.log(cid.multihash.size) // should equal 32 bytes for sha256
  console.log(cid)
  // CID(bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea)
}

run1().catch((err) => {
  console.error(err)
  process.exit(1)
})

// ** Example 2: sha3-512 hasher **

const sha512 = hasher.from({
  // As per multiformats table
  // https://github.com/multiformats/multicodec/blob/master/table.csv#L9
  name: 'sha3-512',
  code: 0x14,

  encode: (input) => new Uint8Array(crypto.createHash('sha512').update(input).digest())
})

async function run2 () {
  const hash2 = await sha512.digest(json.encode({ hello: 'world' }))
  const cid2 = CID.create(1, json.code, hash2)

  console.log(cid2.multihash.size) // should equal 64 bytes for sha512
  console.log(cid2)
  // CID(bagaaifca7d5wrebdi6rmqkgtrqyodq3bo6gitrqtemxtliymakwswbazbu7ai763747ljp7ycqfv7aqx4xlgiugcx62quo2te45pcgjbg4qjsvq)
}

run2().catch((err) => {
  console.error(err)
  process.exit(1)
})
