/* globals describe, it */
import * as codec from 'multiformats/codecs/json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import * as main from 'multiformats/block'
import { CID, bytes } from 'multiformats'
import { assert } from 'chai'

const fixture = { hello: 'world' }
const link = CID.parse('bafyreidykglsfhoixmivffc5uwhcgshx4j465xwqntbmu43nb2dzqwfvae')
const buff = bytes.fromString('sadf')

describe('block', () => {
  it('basic encode/decode roundtrip', async () => {
    const block = await main.encode({ value: fixture, codec, hasher })
    const block2 = await main.decode({ bytes: block.bytes, codec, hasher })
    assert.deepStrictEqual(block.cid.equals(block2.cid), true)
    assert.deepStrictEqual(block.cid.equals(block2.cid), true)
    assert.deepStrictEqual(fixture, block2.value)
    const block3 = await main.create({ bytes: block.bytes, cid: block.cid, codec, hasher })
    assert.deepStrictEqual(block3.cid.equals(block2.cid), true)
  })

  it('createUnsafe', async () => {
    const block = await main.encode({ value: fixture, codec, hasher })
    const block2 = main.createUnsafe({ bytes: block.bytes, cid: block.cid, codec })
    assert.deepStrictEqual(block.cid.equals(block2.cid), true)
  })

  describe('reader', () => {
    const value = { link, nope: 'skip', arr: [link], obj: { arr: [{ obj: {} }] }, bytes: Uint8Array.from('1234') }
    const block = main.createUnsafe({ value, codec, hasher, cid: true, bytes: true })

    it('links', () => {
      const expected = ['link', 'arr/0']
      for (const [path, cid] of block.links()) {
        assert.deepStrictEqual(path, expected.shift())
        assert.deepStrictEqual(cid.toString(), link.toString())
      }
    })

    it('tree', () => {
      const expected = ['link', 'nope', 'arr', 'arr/0', 'obj', 'obj/arr', 'obj/arr/0', 'obj/arr/0/obj', 'bytes']
      for (const path of block.tree()) {
        assert.deepStrictEqual(path, expected.shift())
      }
    })

    it('get', () => {
      let ret = block.get('link/test')
      assert.deepStrictEqual(ret.remaining, 'test')
      assert.deepStrictEqual(ret.value.toString(), link.toString())
      ret = block.get('nope')
      assert.deepStrictEqual(ret, { value: 'skip' })
    })

    it('null links/tree', () => {
      const block = main.createUnsafe({ value: null, codec, hasher, bytes: true, cid: true })
      // eslint-disable-next-line
      for (const x of block.tree()) {
        throw new Error(`tree should have nothing, got "${x}"`)
      }
      // eslint-disable-next-line
      for (const x of block.links()) {
        throw new Error(`links should have nothing, got "${x}"`)
      }
    })
  })

  it('kitchen sink', () => {
    const sink = { one: { two: { arr: [true, false, null], three: 3, buff, link } } }
    const block = main.createUnsafe({ value: sink, codec, bytes: true, cid: true })
    assert.deepStrictEqual(sink, block.value)
  })

  describe('errors', () => {
    it('constructor missing args', () => {
      let threw = true
      try {
        threw = new main.Block({})
        threw = false
      } catch (e) {
        if (e.message !== 'Missing required argument') throw e
      }
      assert.deepStrictEqual(threw, true)
    })

    const errTest = async (method, arg, message) => {
      let threw = true
      try {
        await method(arg)
        threw = false
      } catch (e) {
        if (e.message !== message) throw e
      }
      assert.deepStrictEqual(threw, true)
    }

    it('encode', async () => {
      await errTest(main.encode, {}, 'Missing required argument "value"')
      await errTest(main.encode, { value: true }, 'Missing required argument: codec or hasher')
    })

    it('decode', async () => {
      await errTest(main.decode, {}, 'Missing required argument "bytes"')
      await errTest(main.decode, { bytes: true }, 'Missing required argument: codec or hasher')
    })

    it('createUnsafe', async () => {
      await errTest(main.createUnsafe, {}, 'Missing required argument, must either provide "value" or "codec"')
    })

    it('create', async () => {
      await errTest(main.create, {}, 'Missing required argument "bytes"')
      await errTest(main.create, { bytes: true }, 'Missing required argument "hasher"')
      const block = await main.encode({ value: fixture, codec, hasher })
      const block2 = await main.encode({ value: { ...fixture, test: 'blah' }, codec, hasher })
      await errTest(main.create, { bytes: block.bytes, cid: block2.cid, codec, hasher }, 'CID hash does not match bytes')
    })

    it('get', async () => {
      const block = await main.encode({ value: fixture, codec, hasher })
      await errTest(path => block.get(path), '/asd/fs/dfasd/f', 'Object has no property at ["asd"]')
    })
  })
})
