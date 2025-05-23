/* globals describe, it */

import { assert } from 'aegir/chai'
import * as bytes from '../src/bytes.js'
import * as json from '../src/codecs/json.js'
import * as raw from '../src/codecs/raw.js'

describe('multicodec', () => {
  it('encode/decode raw', () => {
    const buff = raw.encode(bytes.fromString('test'))
    assert.deepStrictEqual(buff, bytes.fromString('test'))
    assert.deepStrictEqual(raw.decode(buff), bytes.fromString('test'))
  })

  it('encode/decode raw arraybuffer', () => {
    const buff = raw.encode(bytes.fromString('test'))
    assert.deepStrictEqual(buff, bytes.fromString('test'))
    // @ts-expect-error
    assert.deepStrictEqual(raw.decode(buff.buffer), bytes.fromString('test'))
  })

  it('encode/decode json', () => {
    const buff = json.encode({ hello: 'world' })
    assert.deepStrictEqual(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    assert.deepStrictEqual(json.decode(buff), { hello: 'world' })
  })

  it('encode/decode json arraybuffer', () => {
    const buff = json.encode({ hello: 'world' })
    assert.deepStrictEqual(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    // @ts-expect-error
    assert.deepStrictEqual(json.decode(buff.buffer), { hello: 'world' })
  })

  it('raw cannot encode string', async () => {
    // @ts-expect-error - 'string' is not assignable to parameter of type 'Uint8Array'
    assert.throws(() => raw.encode('asdf'), 'Unknown type, must be binary type')
  })
})
