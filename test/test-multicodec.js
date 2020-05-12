/* globals describe, it */
'use strict'
const bytes = require('../bytes')
const assert = require('assert')
const same = assert.deepStrictEqual
const multiformats = require('../basics')
const test = it

const testThrow = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}

describe('multicodec', () => {
  const { multicodec } = multiformats

  test('encode/decode raw', () => {
    const buff = multicodec.encode(bytes.fromString('test'), 'raw')
    same(buff, bytes.fromString('test'))
    same(multicodec.decode(buff, 'raw'), bytes.fromString('test'))
  })

  test('encode/decode json', () => {
    const buff = multicodec.encode({ hello: 'world' }, 'json')
    same(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    same(multicodec.decode(buff, 'json'), { hello: 'world' })
  })

  test('raw cannot encode string', async () => {
    await testThrow(() => multicodec.encode('asdf', 'raw'), 'Unknown type, must be binary type')
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
      return { code: 200, name: 'blip', encode: (a) => a[1], decode: (a) => a }
    })
    same(calls, 1, 'called exactly once')
    const two = bytes.fromString('two')
    const three = bytes.fromString('three')
    same(multicodec.encode(['one', two, three], 'blip'), two, 'new codec encoder was added')
    same(multicodec.decode(three, 200), three, 'new codec decoder was added')
  })
})
