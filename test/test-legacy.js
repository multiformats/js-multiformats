/* globals before, describe, it */
import { Buffer } from 'buffer'
import assert from 'assert'
import { legacy } from 'multiformats/legacy'
import * as rawCodec from 'multiformats/codecs/raw'
import * as jsonCodec from 'multiformats/codecs/json'
import { sha256, sha512 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'

const same = assert.deepStrictEqual
const test = it

const testThrow = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  /* c8 ignore next */
  throw new Error('Test failed to throw')
}

const hashes = {
  [sha256.name]: sha256,
  [sha512.name]: sha512
}

describe('multicodec', () => {
  let raw
  let json
  let custom
  let link
  before(async () => {
    raw = legacy(rawCodec, { hashes })
    json = legacy(jsonCodec, { hashes })
    link = await raw.util.cid(Buffer.from('test'))
    custom = legacy({
      name: 'custom',
      code: 6787678,
      encode: o => {
        if (o.link) {
          assert.ok(o.link.code)
          o.link = true
        }
        return json.util.serialize({ o, l: link.toString() })
      },
      decode: buff => {
        const obj = json.util.deserialize(buff)
        obj.l = link
        if (obj.o.link) obj.link = CID.asCID(link)
        return obj
      }
    }, { hashes })
  })
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
    const { bytes } = await sha256.digest(Buffer.from('test'))
    same(cid.multihash, Buffer.from(bytes))

    const msg = 'Hasher for md5 was not provided in the configuration'
    testThrow(async () => await raw.util.cid(Buffer.from('test'), { hashAlg: 'md5' }), msg)
  })
  test('resolve', async () => {
    const fixture = custom.util.serialize({
      one: {
        two: {
          hello: 'world'
        },
        three: 3
      }
    })
    let value = { hello: 'world' }
    same(custom.resolver.resolve(fixture, 'o/one/two'), { value, remainderPath: '' })
    value = 'world'
    same(custom.resolver.resolve(fixture, 'o/one/two/hello'), { value, remainderPath: '' })
    value = link
    same(custom.resolver.resolve(fixture, 'l/outside'), { value, remainderPath: 'outside' })
    await testThrow(() => custom.resolver.resolve(fixture, 'o/two'), 'Not found')
  })
  test('tree', () => {
    const fixture = custom.util.serialize({
      one: {
        two: {
          hello: 'world'
        },
        three: 3
      }
    })
    const arr = a => Array.from(a)
    const links = ['/o', '/o/one', '/o/one/two', '/o/one/two/hello', '/o/one/three', '/l']
    same(arr(custom.resolver.tree(fixture)), links)
    same(arr(json.resolver.tree(json.util.serialize('asdf'))), [])
  })
  test('cid API change', () => {
    const fixture = { link }
    const buff = custom.util.serialize(fixture)
    const decoded = custom.util.deserialize(buff)
    same(decoded.link, link)
  })
})
