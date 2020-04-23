/* globals describe, it */
'use strict'
const { Buffer } = require('buffer')
const assert = require('assert')
const same = assert.deepStrictEqual
const multiformat = require('../')
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

const raw = buff => {
  if (!Buffer.isBuffer(buff)) throw new Error('Only buffer instances can be used w/ raw codec')
  return buff
}
const encode = raw
const decode = raw

describe('multicodec', () => {
  const { multicodec } = multiformat()
  multicodec.add([{ code: 85, name: 'raw', encode, decode }])
  test('encode/decode raw', () => {
    const buff = multicodec.encode(Buffer.from('test'), 'raw')
    same(buff, Buffer.from('test'))
    same(multicodec.decode(buff, 'raw'), Buffer.from('test'))
  })
  test('get failure', () => {
    testThrow(() => multicodec.get(true), 'Unknown key type')
    let msg = 'Do not have multiformat entry for "8237440"'
    testThrow(() => multicodec.get(8237440), msg)
    msg = 'Do not have multiformat entry for "notfound"'
    testThrow(() => multicodec.get('notfound'), msg)
  })
})
