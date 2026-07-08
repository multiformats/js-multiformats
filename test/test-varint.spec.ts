/* globals describe, it */

import { assert } from 'aegir/chai'
import { varint } from '../src/index.ts'

const UTF8 = new TextEncoder()

describe('varint', () => {
  it('can decode with offset', () => {
    const message = UTF8.encode('hello-world')
    const outerTag = 0x55
    const innerTag = 0xe3
    const outerTagSize = varint.encodingLength(outerTag)
    const innerTagSize = varint.encodingLength(innerTag)

    const bytes = new Uint8Array(message.byteLength + outerTagSize + innerTagSize)
    varint.encodeTo(outerTag, bytes)
    varint.encodeTo(innerTag, bytes, outerTagSize)
    bytes.set(message, outerTagSize + innerTagSize)

    assert.deepStrictEqual(varint.decode(bytes), [outerTag, outerTagSize])
    assert.deepStrictEqual(varint.decode(bytes, outerTagSize), [innerTag, innerTagSize])
  })

  it('rejects non-minimally encoded varints', () => {
    // 1 encodes minimally as [0x01]; [0x81, 0x00] is a non-minimal encoding of 1
    assert.throws(() => varint.decode(Uint8Array.from([0x81, 0x00])), /minimal/)
    // 0 encodes minimally as [0x00]; [0x80, 0x00] is a non-minimal encoding of 0
    assert.throws(() => varint.decode(Uint8Array.from([0x80, 0x00])), /minimal/)
    // non-minimal encoding at a non-zero offset
    assert.throws(() => varint.decode(Uint8Array.from([0xff, 0x81, 0x00]), 1), /minimal/)
    // 127 encodes minimally as [0x7f]; [0xff, 0x00] is a non-minimal encoding of 127
    assert.throws(() => varint.decode(Uint8Array.from([0xff, 0x00])), /minimal/)
  })

  it('accepts interior zero groups', () => {
    // 16384 = 1 << 14; the two leading groups are zero but the encoding is minimal
    assert.deepStrictEqual(varint.decode(Uint8Array.from([0x80, 0x80, 0x01])), [16384, 3])
  })

  it('rejects varints longer than 9 bytes', () => {
    // the unsigned-varint spec caps varints at 9 bytes (63 bits)
    assert.throws(
      () => varint.decode(Uint8Array.from([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x01])),
      /too long/
    )
  })
})
