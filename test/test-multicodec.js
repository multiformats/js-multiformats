/* globals describe, it */
import * as bytes from '../src/bytes.js'
import assert from 'assert'
import * as multiformats from 'multiformats/basics'
import { codec } from 'multiformats/codecs/codec'
const same = assert.deepStrictEqual
const test = it

const testThrow = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}

describe('multicodec', () => {
  const { codecs: { raw, json } } = multiformats

  test('encode/decode raw', () => {
    const buff = raw.encodeBlock(bytes.fromString('test'))
    same(buff, bytes.fromString('test'))
    same(raw.decodeBlock(buff, 'raw'), bytes.fromString('test'))
  })

  test('encode/decode json', () => {
    const buff = json.encodeBlock({ hello: 'world' })
    same(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    same(json.decodeBlock(buff), { hello: 'world' })
  })

  test('raw cannot encode string', async () => {
    await testThrow(() => raw.encodeBlock('asdf'), 'Unknown type, must be binary type')
  })

  test('add with function', () => {
    const blip = codec({
      code: 200,
      name: 'blip',
      encode: (a) => a[1],
      decode: (a) => a
    })

    const two = bytes.fromString('two')
    const three = bytes.fromString('three')
    same(blip.encodeBlock(['one', two, three]), two)
    same(blip.decodeBlock(three, 200), three)
  })
})
