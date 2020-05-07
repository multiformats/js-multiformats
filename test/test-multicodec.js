/* globals describe, it */
'use strict'
const { Buffer } = require('buffer')
const assert = require('assert')
const same = assert.deepStrictEqual
const multiformats = require('../basics')
const test = it

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
    assert.throws(() => multicodec.get(true), /^Error: Unknown key type$/)
    let msg = /^Error: Do not have multiformat entry for "8237440"$/
    assert.throws(() => multicodec.get(8237440), msg)
    msg = /^Error: Do not have multiformat entry for "notfound"$/
    assert.throws(() => multicodec.get('notfound'), msg)
  })

  test('add with function', () => {
    let calls = 0
    multicodec.add((...args) => {
      calls++
      same(args.length, 1, 'called with single arg')
      assert(args[0] === multiformats, 'called with multiformats as argument')
      return { code: 200, name: 'blip', encode: (a) => a[1], decode: (a) => a[2] }
    })
    same(calls, 1, 'called exactly once')
    same(multicodec.encode(['one', 'two', 'three'], 'blip'), 'two', 'new codec encoder was added')
    same(multicodec.decode(['one', 'two', 'three'], 200), 'three', 'new codec decoder was added')
  })
})
