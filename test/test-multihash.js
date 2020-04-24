/* globals describe, it */
'use strict'
const assert = require('assert')
const same = assert.deepStrictEqual
const multiformat = require('../')
const intTable = require('multicodec/src/int-table')
const valid = require('./fixtures/valid-multihash.js')
const invalid = require('./fixtures/invalid-multihash.js')
const test = it

const table = Array.from(intTable.entries())

const sample = (code, size, hex) => {
  const toHex = (i) => {
    if (typeof i === 'string') return i
    const h = i.toString(16)
    return h.length % 2 === 1 ? `0${h}` : h
  }
  return Buffer.from(`${toHex(code)}${toHex(size)}${hex}`, 'hex')
}

const testThrow = (fn, message) => {
  try {
    fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}
const testThrowAsync = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}
const crypto = require('crypto')
const encode = data => crypto.createHash('sha256').update(data).digest()

describe('multihash', () => {
  const { multihash } = multiformat(table)
  const name = 'sha2-256'
  const { code } = multihash.get(name)
  console.log({code})
  multihash.add([{ code, name, encode }])
  const { validate } = multihash

  describe('encode', () => {
    test('valid', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, name, varint } = encoding
        const buf = sample(varint || code, size, hex)
        same(multihash.encode(Buffer.from(hex, 'hex'), code), buf)
        same(multihash.encode(Buffer.from(hex, 'hex'), name), buf)
      }
    })
    test('hash sha2-256', async () => {
      const hash = await multihash.hash(Buffer.from('test'), name)
      const { digest, code } = multihash.decode(hash)
      same(code, multihash.get('sha2-256').code)
      same(encode(Buffer.from('test')).compare(digest), 0)
      same(validate(hash), true)
      same(validate(hash, Buffer.from('test')), true)
    })
    test('no such hash', async () => {
      let msg = 'Do not have multiformat entry for "notfound"'
      await testThrowAsync(() => multihash.hash(Buffer.from('test'), 'notfound'), msg)
      msg = 'Missing hash implementation for "json"'
      await testThrowAsync(() => multihash.hash(Buffer.from('test'), 'json'), msg)
    })
  })
  describe('decode', () => {
    test('valid fixtures', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, name, varint } = encoding
        const buf = sample(varint || code, size, hex)
        const digest = Buffer.from(hex, 'hex')
        same(multihash.decode(buf), { code, name, digest, length: size })
      }
    })
    test('get from buffer', async () => {
      const hash = await multihash.hash(Buffer.from('test'), 'sha2-256')
      const { code, name } = multihash.get(hash)
      same({ code, name }, { code: 18, name: 'sha2-256' })
    })
  })
  describe('validate', () => {
    test('invalid hash sha2-256', async () => {
      const hash = await multihash.hash(Buffer.from('test'), name)
      const msg = 'Buffer does not match hash'
      testThrow(() => validate(hash, Buffer.from('tes2t')), msg)
    })
    test('invalid fixtures', () => {
      for (const test of invalid) {
        const buff = Buffer.from(test.hex, 'hex')
        testThrow(() => validate(buff), test.message)
      }
    })
  })
})
