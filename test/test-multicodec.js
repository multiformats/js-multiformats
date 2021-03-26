/* globals describe, it */
import * as bytes from '../src/bytes.js'
import assert from 'assert'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'
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
  /* c8 ignore next */
  throw new Error('Test failed to throw')
}

describe('multicodec', () => {
  test('encode/decode raw', () => {
    const buff = raw.encode(bytes.fromString('test'))
    same(buff, bytes.fromString('test'))
    same(raw.decode(buff, 'raw'), bytes.fromString('test'))
  })

  test('encode/decode json', () => {
    const buff = json.encode({ hello: 'world' })
    same(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    same(json.decode(buff), { hello: 'world' })
  })

  test('json.encoder', () => {
    const { encoder } = json
    same(encoder === json.encoder, true, 'getter cached decoder')

    const buff = encoder.encode({ hello: 'world' })
    same(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
  })

  test('json.decoder', () => {
    const { decoder } = json
    same(decoder === json.decoder, true, 'getter cached encoder')

    const buff = json.encode({ hello: 'world' })
    same(decoder.decode(buff), { hello: 'world' })
  })

  test('raw cannot encode string', async () => {
    await testThrow(() => raw.encode('asdf'), 'Unknown type, must be binary type')
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
    same(blip.encode(['one', two, three]), two)
    same(blip.decode(three, 200), three)
  })
})
