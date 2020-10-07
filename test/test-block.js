/* globals describe, it */
import codec from 'multiformats/codecs/json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import * as main from 'multiformats/block'
import { CID, bytes } from 'multiformats'
import { deepStrictEqual as same } from 'assert'

const test = it
const fixture = { hello: 'world' }
const link = CID.parse('bafyreidykglsfhoixmivffc5uwhcgshx4j465xwqntbmu43nb2dzqwfvae')
const buff = bytes.fromString('sadf')

describe('block', () => {
  test('basic encode/decode roundtrip', async () => {
    const block = main.encoder({ source: fixture, codec, hasher })
    same(block.code, codec.code)
    const data = block.encode()
    const block2 = main.decoder({ data, codec, hasher })
    const [ cid1, cid2 ] = await Promise.all([ block.cid(), block2.cid() ])
    same(await cid1.equals(cid2), true)
    same(await block.equals(block2), true)
    same(fixture, block2.decode())
    const block3 = await main.create({ data, cid: cid1, codec, hasher })
    same(block3.code, codec.code)
    same(await block3.equals(block2), true)
  })
  describe('reader', () => {
    const source = { link, nope: 'skip', arr: [link], obj: { arr: [{obj:{}}] } }
    const block = main.encoder({ source, codec, hasher })
    test('links', () => {
      const expected = [ 'link', 'arr/0' ]
      for (const [ path, cid ] of block.links()) {
        same(path, expected.shift())
        same(cid.toString(), link.toString())
      }
    })
    test('tree', () => {
      const expected = [ 'link', 'nope', 'arr', 'arr/0', 'obj', 'obj/arr', 'obj/arr/0', 'obj/arr/0/obj' ]
      for (const path of block.tree()) {
        same(path, expected.shift())
      }
    })
    test('get', () => {
      let ret = block.get('link/test')
      same(ret.remaining, 'test')
      same(ret.value.toString(), link.toString())
      ret = block.get('nope')
      same(ret, { value: 'skip' })
    })
    test('null links/tree', () => {
      const block = main.encoder({source: null, codec, hasher})
      for (const x of block.tree()) {
        throw new Error('tree should have nothing')
      }
      for (const x of block.links()) {
        throw new Error('links should have nothing')
      }
    })
  })

  test('kitchen sink', () => {
    const sink = { one: { two: { arr: [ true, false, null ], three: 3, buff, link } } }
    const block = main.encoder({ source: sink, codec, hasher })
    same(sink, block.decode())
  })
})
