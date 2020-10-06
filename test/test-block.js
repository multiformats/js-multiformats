/* globals describe, it */
import codec from 'multiformats/codecs/json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import * as main from 'multiformats/block'
import { deepStrictEqual as same } from 'assert'

const test = it
const fixture = { hello: 'world' }

describe('block', () => {
  test('basic encode/decode roundtrip', async () => {
    const block = main.encoder({ source: fixture, codec, hasher })
    const data = block.encode()
    const block2 = main.decoder({ data, codec, hasher })
    const [ cid1, cid2 ] = await Promise.all([ block.cid(), block2.cid() ])
    same(await cid1.equals(cid2), true)
    same(await block.equals(block2), true)
    const block3 = await main.create({ data, cid: cid1, codec, hasher })
    same(await block3.equals(block2), true)
  })
})
