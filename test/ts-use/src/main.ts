import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'
import { identity } from 'multiformats/hashes/identity'
import * as json from 'multiformats/codecs/json'
import { bytes } from 'multiformats'
import { MultihashHasher } from 'multiformats/hashes/hasher'
import { MultihashDigest } from 'multiformats/cid'
import { SyncMultihashHasher } from 'multiformats/hashes/interface'

const main = async () => {
  const block = await Block.encode({
    value: { hello: 'world' },
    hasher: sha256,
    codec: json
  })

  console.log(block)

  console.log('async hasher')
  await executeAsyncHasher(sha256, 'hash')

  console.log('sync hasher')
  executeSyncHasher(identity, 'hash')
}

async function executeAsyncHasher<Alg extends number> (hasher : MultihashHasher<Alg>, input : string) {
  const mhdigest : MultihashDigest = await hasher.digest(new TextEncoder().encode(input))
  const digest : Uint8Array = await hasher.encode(new TextEncoder().encode(input))
  console.log('multihash:', bytes.toHex(mhdigest.bytes))
  console.log('digest:   ', bytes.toHex(digest))
  if (bytes.toHex(mhdigest.digest) !== bytes.toHex(digest)) {
    throw new Error('busted interface')
  }
}

function executeSyncHasher<Alg extends number> (hasher : SyncMultihashHasher<Alg>, input : string) {
  const mhdigest : MultihashDigest = hasher.digest(new TextEncoder().encode(input))
  const digest : Uint8Array = hasher.encode(new TextEncoder().encode(input))
  console.log('multihash:', bytes.toHex(mhdigest.bytes))
  console.log('digest:   ', bytes.toHex(digest))
  if (bytes.toHex(mhdigest.digest) !== bytes.toHex(digest)) {
    throw new Error('busted interface')
  }
}

export default main

/*
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
*/
