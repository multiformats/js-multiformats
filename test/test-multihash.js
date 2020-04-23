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

const crypto = require('crypto')
const encode = data => crypto.createHash('sha256').update(data).digest()

describe('multihash', () => {
  const { multihash } = multiformat(table)
  const name = 'sha2-256'
  const { code } = multihash.get(name)
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
    /*
    test('invalid', () => {
      for (const test of invalid) {
        console.log(test)
      }
    })
    */
  })

  describe('decode', () => {
    test('valid', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, name, varint } = encoding
        const buf = sample(varint || code, size, hex)
        const digest = Buffer.from(hex, 'hex')
        same(multihash.decode(buf), { code, name, digest, length: size })
      }
    })
  })

  /*
  describe('validate', () => {
    test('invalid', () => {
      for (const test of invalid) {
        const buff = sample(test.encoding.varint || test.code, test.size, test.hex)
        multihash.validate(buff)
      }
      const longBuffer = Buffer.alloc(150, 'a')
      multihash.validate(longBuffer)
    })
  })
  */
})
