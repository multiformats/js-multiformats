import * as Block from 'multiformats/block'
import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'

async function run () {
  const value = { hello: 'world' }

  // encode a block
  const block = await Block.encode({ value, codec, hasher })

  // block.value --> { hello: 'world' }
  // block.bytes --> Uint8Array
  // block.cid --> CID() w/ sha2-256 hash address and dag-cbor codec

  console.log('Example block CID: ' + block.cid.toString())

  // you can also decode blocks from their binary state
  const block2 = await Block.decode({ bytes: block.bytes, codec, hasher })

  // check for equivalency using cid interface
  console.log('Example block CID equal to decoded binary block: ' + block.cid.equals(block2.cid))

  // if you have the cid you can also verify the hash on decode
  const block3 = await Block.create({ bytes: block.bytes, cid: block.cid, codec, hasher })
  console.log('Example block CID equal to block created from CID + bytes: ' + block.cid.equals(block3.cid))
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
