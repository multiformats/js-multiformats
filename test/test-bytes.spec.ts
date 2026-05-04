/* globals describe, it */

import { assert } from 'aegir/chai'
import * as bytes from '../src/bytes.ts'

describe('bytes', () => {
  it('isBinary', () => {
    assert.deepStrictEqual(bytes.isBinary(new ArrayBuffer(0)), true)
    assert.deepStrictEqual(bytes.isBinary(new DataView(new ArrayBuffer(0))), true)
  })

  it('coerce', () => {
    const fixture = bytes.fromString('test')
    assert.deepStrictEqual(bytes.coerce(fixture.buffer), fixture)
    assert.deepStrictEqual(bytes.coerce(new DataView(fixture.buffer)), fixture)
  })

  it('equals', () => {
    const fixture = bytes.fromString('test')
    assert.deepStrictEqual(bytes.equals(fixture, bytes.fromString('asdfadf')), false)
  })

  it('toString()', () => {
    const fixture = 'hello world'
    assert.deepStrictEqual(bytes.toString(bytes.fromString(fixture)), fixture)
  })

  it('toArrayBufferBackedArray()', () => {
    const b = new Uint8Array(10)
    assert.equal(b, bytes.toArrayBufferBackedArray(b))

    const s = new SharedArrayBuffer(10)
    const b2 = new Uint8Array(s, 0, s.byteLength)
    assert.notEqual(b2, bytes.toArrayBufferBackedArray(b2) as any)
    assert.deepEqual(b, bytes.toArrayBufferBackedArray(b2))
  })
})
