/* globals describe, it */
'use strict'
const { Buffer } = require('buffer')
const assert = require('assert')
const same = assert.deepStrictEqual
const multiformats = require('../basics').bufferApi
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
describe('multicodec', () => {
  const { multicodec } = multiformats
  test('encode/decode raw', () => {
    const buff = multicodec.encode(Buffer.from('test'), 'raw')
    same(buff, Buffer.from('test'))
    same(multicodec.decode(buff, 'raw'), Buffer.from('test'))
  })
  test('encode/decode json', () => {
    const buff = multicodec.encode({ hello: 'world' }, 'json')
    same(buff, Buffer.from(JSON.stringify({ hello: 'world' })))
    same(multicodec.decode(buff, 'json'), { hello: 'world' })
  })
  test('raw cannot encode string', () => {
    testThrow(() => multicodec.encode('asdf', 'raw'), 'Only Uint8Array instances can be used w/ raw codec')
  })
  test('get failure', () => {
    testThrow(() => multicodec.get(true), 'Unknown key type')
    let msg = 'Do not have multiformat entry for "8237440"'
    testThrow(() => multicodec.get(8237440), msg)
    msg = 'Do not have multiformat entry for "notfound"'
    testThrow(() => multicodec.get('notfound'), msg)
  })
})
