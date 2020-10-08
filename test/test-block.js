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
    const block = await main.encode({ value: fixture, codec, hasher })
    const block2 = await main.decode({ bytes: block.bytes, codec, hasher })
    same(await block.cid.equals(block2.cid), true)
    same(await block.cid.equals(block2.cid), true)
    same(fixture, block2.value)
    const block3 = await main.create({ bytes: block.bytes, cid: block.cid, codec, hasher })
    same(await block3.cid.equals(block2.cid), true)
  })
  describe('reader', () => {
    const value = { link, nope: 'skip', arr: [link], obj: { arr: [{ obj: {} }] } }
    const block = main.createUnsafe({ value, codec, hasher, cid: true, bytes: true })
    test('links', () => {
      const expected = ['link', 'arr/0']
      for (const [path, cid] of block.links()) {
        same(path, expected.shift())
        same(cid.toString(), link.toString())
      }
    })
    test('tree', () => {
      const expected = ['link', 'nope', 'arr', 'arr/0', 'obj', 'obj/arr', 'obj/arr/0', 'obj/arr/0/obj']
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
      const block = main.createUnsafe({ value: null, codec, hasher, bytes: true, cid: true })
      for (const x of block.tree()) {
        throw new Error(`tree should have nothing, got "${x}"`)
      }
      for (const x of block.links()) {
        throw new Error(`links should have nothing, got "${x}"`)
      }
    })
  })

  test('kitchen sink', () => {
    const sink = { one: { two: { arr: [true, false, null], three: 3, buff, link } } }
    const block = main.createUnsafe({ value: sink, codec, hasher, bytes: true, cid: true })
    same(sink, block.value)
  })
})
