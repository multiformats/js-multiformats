/* globals describe, it */
import random from 'js-crypto-random'
import codec from 'multiformats/codecs/json'
import * as ciphers from 'multiformats/codecs/aes'
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
    same(block.cid.equals(block2.cid), true)
    same(block.cid.equals(block2.cid), true)
    same(fixture, block2.value)
    const block3 = await main.create({ bytes: block.bytes, cid: block.cid, codec, hasher })
    same(block3.cid.equals(block2.cid), true)
  })
  test('createUnsafe', async () => {
    const block = await main.encode({ value: fixture, codec, hasher })
    const block2 = main.createUnsafe({ bytes: block.bytes, cid: block.cid, codec })
    same(block.cid.equals(block2.cid), true)
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

  describe('ciphers', () => {
    const createTest = name => {
      const json = codec
      test(`aes-${name}`, async () => {
        const block = await main.encode({ value: fixture, codec: json, hasher })
        const codec = ciphers[name]
        const key = random.getRandomBytes(32)
        const value = await codec.encrypt({ ...block, key })
        const eblock = await main.encode({ codec, value, hasher })
        const eeblock = await main.decode({ codec, bytes: eblock.bytes, hasher })
        same(eblock.cid.toString(), eeblock.cid.toString())
        same([...eblock.bytes], [...eeblock.bytes])
        same([...eblock.value.bytes], [...eeblock.value.bytes])
        same([...eblock.value.iv], [...eeblock.value.iv])
        const { cid, bytes } = await eblock.decrypt(key)
        same(block.cid.toString(), cid.toString())
        same([...bytes], [...block.bytes])
        const dblock = await main.create({ cid, bytes, codec: json, hasher })
        same(block.value, dblock.value)
      })
    }
    createTest('gcm')
    createTest('cbc')
    createTest('ctr')
  })

  test('kitchen sink', () => {
    const sink = { one: { two: { arr: [true, false, null], three: 3, buff, link } } }
    const block = main.createUnsafe({ value: sink, codec, bytes: true, cid: true })
    same(sink, block.value)
  })

  describe('errors', () => {
    test('constructor missing args', () => {
      let threw = true
      try {
        threw = new main.Block({})
        threw = false
      } catch (e) {
        if (e.message !== 'Missing required argument') throw e
      }
      same(threw, true)
    })
    const errTest = async (method, arg, message) => {
      let threw = true
      try {
        await method(arg)
        threw = false
      } catch (e) {
        if (e.message !== message) throw e
      }
      same(threw, true)
    }
    test('encode', async () => {
      await errTest(main.encode, {}, 'Missing required argument "value"')
      await errTest(main.encode, { value: true }, 'Missing required argument: codec or hasher')
    })
    test('decode', async () => {
      await errTest(main.decode, {}, 'Missing required argument "bytes"')
      await errTest(main.decode, { bytes: true }, 'Missing required argument: codec or hasher')
    })
    test('createUnsafe', async () => {
      await errTest(main.createUnsafe, {}, 'Missing required argument, must either provide "value" or "codec"')
    })
    test('create', async () => {
      await errTest(main.create, {}, 'Missing required argument "bytes"')
      await errTest(main.create, { bytes: true }, 'Missing required argument "hasher"')
      const block = await main.encode({ value: fixture, codec, hasher })
      const block2 = await main.encode({ value: { ...fixture, test: 'blah' }, codec, hasher })
      await errTest(main.create, { bytes: block.bytes, cid: block2.cid, codec, hasher }, 'CID hash does not match bytes')
    })
    test('get', async () => {
      const block = await main.encode({ value: fixture, codec, hasher })
      await errTest(path => block.get(path), '/asd/fs/dfasd/f', 'Object has no property at ["asd"]')
    })
  })
})
