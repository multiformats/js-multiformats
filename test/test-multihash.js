/* globals describe, it */
'use strict'
const bytes = require('../bytes')
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
  return bytes.fromHex(`${toHex(code)}${toHex(size)}${hex}`)
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
const encode = name => data => crypto.createHash(name).update(data).digest()

describe('multihash', () => {
  const { multihash } = multiformat(table)
  multihash.add(require('../hashes/sha2'))
  const { validate } = multihash
  const empty = new Uint8Array(0)

  describe('encode', () => {
    test('valid', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, name, varint } = encoding
        const buf = sample(varint || code, size, hex)
        same(multihash.encode(hex ? bytes.fromHex(hex) : empty, code), buf)
        same(multihash.encode(hex ? bytes.fromHex(hex) : empty, name), buf)
      }
    })
    test('hash sha2-256', async () => {
      const hash = await multihash.hash(bytes.fromString('test'), 'sha2-256')
      const { digest, code } = multihash.decode(hash)
      same(code, multihash.get('sha2-256').code)
      same(encode('sha256')(bytes.fromString('test')).compare(digest), 0)
      same(await validate(hash), true)
      same(await validate(hash, bytes.fromString('test')), true)
    })
    test('hash sha2-512', async () => {
      const hash = await multihash.hash(bytes.fromString('test'), 'sha2-512')
      const { digest, code } = multihash.decode(hash)
      same(code, multihash.get('sha2-512').code)
      same(encode('sha512')(bytes.fromString('test')).compare(digest), 0)
      same(await validate(hash), true)
      same(await validate(hash, bytes.fromString('test')), true)
    })
    test('no such hash', async () => {
      let msg = 'Do not have multiformat entry for "notfound"'
      await testThrowAsync(() => multihash.hash(bytes.fromString('test'), 'notfound'), msg)
      msg = 'Missing hash implementation for "json"'
      await testThrowAsync(() => multihash.hash(bytes.fromString('test'), 'json'), msg)
    })
  })
  describe('decode', () => {
    test('valid fixtures', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, name, varint } = encoding
        const buf = sample(varint || code, size, hex)
        const digest = hex ? bytes.fromHex(hex) : empty
        same(multihash.decode(buf), { code, name, digest, length: size })
      }
    })
    test('get from buffer', async () => {
      const hash = await multihash.hash(bytes.fromString('test'), 'sha2-256')
      const { code, name } = multihash.get(hash)
      same({ code, name }, { code: 18, name: 'sha2-256' })
    })
  })
  describe('validate', async () => {
    test('invalid hash sha2-256', async () => {
      const hash = await multihash.hash(bytes.fromString('test'), 'sha2-256')
      const msg = 'Buffer does not match hash'
      await testThrowAsync(() => validate(hash, bytes.fromString('tes2t')), msg)
    })
    test('invalid fixtures', async () => {
      for (const test of invalid) {
        const buff = bytes.fromHex(test.hex)
        await testThrowAsync(() => validate(buff), test.message)
      }
    })
  })
  test('throw on hashing non-buffer', async () => {
    await testThrowAsync(() => multihash.hash('asdf'), 'Unknown type, must be binary type')
  })
  if (process.browser) {
    test('browser bundle', () => {
      const mod = require('../hashes/sha2')
      same(mod.___browser, true)
    })
  }
})
