/* globals describe, it */
import * as bytes from 'multiformats/bytes.js'
import assert from 'assert'
import { create as multiformat } from 'multiformats/index.js'
import base16 from 'multiformats/bases/base16.js'
import base32 from 'multiformats/bases/base32.js'
import base58 from 'multiformats/bases/base58.js'
import base64 from 'multiformats/bases/base64.js'
import basics from 'multiformats/basics.js'
import { __browser } from 'multiformats/bases/_base64.js'
const basicsMultibase = basics.multibase
const same = assert.deepStrictEqual
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
  multibase.add(base16)
  multibase.add(base32)
  multibase.add(base58)
  multibase.add(base64)
  test('browser', () => {
    same(!!__browser, !!process.browser)
  })

  for (const base of ['base16', 'base32', 'base58btc', 'base64']) {
    describe(`basics ${base}`, () => {
      test('encode/decode', () => {
        const string = multibase.encode(bytes.fromString('test'), base)
        same(string[0], multibase.get(base).prefix)
        const buffer = multibase.decode(string)
        same(buffer, bytes.fromString('test'))
      })
      test('pristine backing buffer', () => {
        // some deepEqual() libraries go as deep as the backing buffer, make sure it's pristine
        const string = multibase.encode(bytes.fromString('test'), base)
        const buffer = multibase.decode(string)
        const expected = bytes.fromString('test')
        same(new Uint8Array(buffer.buffer).join(','), new Uint8Array(expected.buffer).join(','))
      })
      test('empty', () => {
        const str = multibase.encode(bytes.fromString(''), base)
        same(str, multibase.get(base).prefix)
        same(multibase.decode(str), bytes.fromString(''))
      })
      test('bad chars', () => {
        const str = multibase.get(base).prefix + '#$%^&*&^%$#'
        const msg = base === 'base58btc' ? 'Non-base58 character' : `invalid ${base} character`
        testThrow(() => multibase.decode(str), msg)
      })
    })
  }

  test('get fails', () => {
    let msg = 'Missing multibase implementation for "x"'
    testThrow(() => multibase.get('x'), msg)
    msg = 'Missing multibase implementation for "notfound"'
    testThrow(() => multibase.get('notfound'), msg)
  })
  test('encode string failure', () => {
    const msg = 'Unknown type, must be binary type'
    testThrow(() => multibase.encode('asdf'), msg)
  })
  test('decode int failure', () => {
    const msg = 'Can only multibase decode strings'
    testThrow(() => multibase.decode(1), msg)
  })
  const buff = bytes.fromString('test')
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
    baseTest(base16)
  })
  describe('base32', () => {
    baseTest(base32)
  })
  describe('base58', () => {
    baseTest(base58)
  })
  describe('base64', () => {
    baseTest(base64)
  })
  test('has', () => {
    same(basicsMultibase.has('E'), false)
    same(basicsMultibase.has('baseNope'), false)
    same(basicsMultibase.has('base32'), true)
    same(basicsMultibase.has('c'), true)
  })
})
