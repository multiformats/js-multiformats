/* globals describe, it */
'use strict'
const { Buffer } = require('buffer')
const assert = require('assert')
const same = assert.deepStrictEqual
const multiformats = require('../basics')
const legacy = require('../legacy')
const test = it

const testThrow = (fn, message) => {
  try {
    fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}
describe('multicodec', async () => {
  const raw = legacy(multiformats, 'raw')
  const json = legacy(multiformats, 'json')
  const link = await raw.util.cid(Buffer.from('test'))
  multiformats.multicodec.add({
    name: 'custom',
    code: 6787678,
    encode: o => json.util.serialize({ o, l: link.toString() }),
    decode: buff => {
      const obj = json.util.deserialize(buff)
      obj.l = link
      return obj
    }
  })
  const custom = legacy(multiformats, 'custom')
  test('encode/decode raw', () => {
    const buff = raw.util.serialize(Buffer.from('test'))
    same(buff, Buffer.from('test'))
    same(raw.util.deserialize(buff), Buffer.from('test'))
  })
  test('encode/decode json', () => {
    const buff = json.util.serialize({ hello: 'world' })
    same(buff, Buffer.from(JSON.stringify({ hello: 'world' })))
    same(json.util.deserialize(buff), { hello: 'world' })
  })
  test('cid', async () => {
    const cid = await raw.util.cid(Buffer.from('test'))
    same(cid.version, 1)
    same(cid.codec, 'raw')
    same(cid.multihash, await multiformats.multihash.hash(Buffer.from('test'), 'sha2-256'))
  })
  const fixture = custom.util.serialize({
    one: {
      two: {
        hello: 'world'
      },
      three: 3
    }
  })
  test('resolve', () => {
    let value = { hello: 'world' }
    same(custom.resolver.resolve(fixture, 'o/one/two'), { value })
    value = 'world'
    same(custom.resolver.resolve(fixture, 'o/one/two/hello'), { value })
    value = link
    same(custom.resolver.resolve(fixture, 'l/outside'), { value, remainderPath: 'outside' })
    testThrow(() => custom.resolver.resolve(fixture, 'o/two'), 'Not found')
  })
  test('tree', () => {
    const arr = a => Array.from(a)
    const links = ['/o', '/o/one', '/o/one/two', '/o/one/two/hello', '/o/one/three', '/l']
    same(arr(custom.resolver.tree(fixture)), links)
    same(arr(json.resolver.tree(json.util.serialize('asdf'))), [])
  })
})
