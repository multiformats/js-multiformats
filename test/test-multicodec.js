/* globals describe, it */
import * as bytes from '../src/bytes.js'
import assert from 'assert'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'
import testThrow from './fixtures/test-throw.js'

const same = assert.deepStrictEqual
const test = it

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

  test('raw cannot encode string', async () => {
    await testThrow(() => raw.encode('asdf'), 'Unknown type, must be binary type')
  })
})
