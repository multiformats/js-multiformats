/* globals describe, it */
import * as bytes from '../src/bytes.js'
import { assert } from 'chai'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'
import { testThrowAsync } from './fixtures/test-throw.js'

describe('multicodec', () => {
  it('encode/decode raw', () => {
    const buff = raw.encode(bytes.fromString('test'))
    assert.deepStrictEqual(buff, bytes.fromString('test'))
    assert.deepStrictEqual(raw.decode(buff), bytes.fromString('test'))
  })

  it('encode/decode json', () => {
    const buff = json.encode({ hello: 'world' })
    assert.deepStrictEqual(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    assert.deepStrictEqual(json.decode(buff), { hello: 'world' })
  })

  it('raw cannot encode string', async () => {
    // @ts-expect-error - 'string' is not assignable to parameter of type 'Uint8Array'
    await testThrowAsync(() => raw.encode('asdf'), 'Unknown type, must be binary type')
  })
})
