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

describe('multibase', () => {
  const { multibase } = multiformat()
  multibase.add(require('../bases/base16'))
  multibase.add(require('../bases/base32'))
  multibase.add(require('../bases/base58'))
  multibase.add(require('../bases/base64'))

  describe('basics', () => {
    for (const base of ['base16', 'base32', 'base58btc', 'base64']) {
      test('encode/decode', () => {
        const string = multibase.encode(Buffer.from('test'), base)
        same(string[0], multibase.get(base).prefix)
        const buffer = multibase.decode(string)
        same(buffer, Buffer.from('test'))
      })
      test('empty', () => {
        const str = multibase.encode(Buffer.from(''), base)
        same(str, multibase.get(base).prefix)
        same(multibase.decode(str), Buffer.from(''))
      })
      test('bad chars', () => {
        const str = multibase.get(base).prefix + '#$%^&*&^%$#'
        const msg = base === 'base58btc' ? 'Non-base58 character' : `invalid ${base} character`
        testThrow(() => multibase.decode(str), msg)
      })
    }
  })

  test('get fails', () => {
    let msg = 'Missing multibase implementation for "x"'
    testThrow(() => multibase.get('x'), msg)
    msg = 'Missing multibase implementation for "notfound"'
    testThrow(() => multibase.get('notfound'), msg)
  })
  test('encode string failure', () => {
    const msg = 'Can only multibase encode buffer instances'
    testThrow(() => multibase.encode('asdf'), msg)
  })
  test('decode int failure', () => {
    const msg = 'Can only multibase decode strings'
    testThrow(() => multibase.decode(1), msg)
  })
  const buff = Buffer.from('test')
  const baseTest = obj => {
    if (Array.isArray(obj)) return obj.forEach(o => baseTest(o))
    const { multibase } = multiformat()
    multibase.add(obj)
    test(`encode/decode ${obj.name}`, () => {
      const encoded = multibase.encode(buff, obj.name)
      const decoded = multibase.decode(encoded)
      same(decoded, buff)
    })
  }
  describe('base16', () => {
    baseTest(require('../bases/base16'))
  })
  describe('base32', () => {
    baseTest(require('../bases/base32'))
  })
  describe('base58', () => {
    baseTest(require('../bases/base58'))
  })
  describe('base64', () => {
    baseTest(require('../bases/base64'))
  })
})
