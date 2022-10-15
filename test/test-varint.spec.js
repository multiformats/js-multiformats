/* globals describe, it */

import { varint } from '../src/index.js'
import { assert } from 'aegir/chai'

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
})
