/* globals describe, it */
import { coerce, fromHex, fromString } from '../src/bytes.js'
import assert from 'assert'
import valid from './fixtures/valid-multihash.js'
import invalid from './fixtures/invalid-multihash.js'
import crypto from 'crypto'
import { sha256, sha512, __browser } from 'multiformats/hashes/sha2'
import { decode as decodeDigest, create as createDigest } from 'multiformats/hashes/digest'
const same = assert.deepStrictEqual
const test = it
const encode = name => data => coerce(crypto.createHash(name).update(data).digest())

const sample = (code, size, hex) => {
  const toHex = (i) => {
    if (typeof i === 'string') return i
    const h = i.toString(16)
    return h.length % 2 === 1 ? `0${h}` : h
  }
  return fromHex(`${toHex(code)}${toHex(size)}${hex}`)
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

describe('multihash', () => {
  const empty = new Uint8Array(0)

  describe('encode', () => {
    test('valid', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, varint } = encoding
        const buf = sample(varint || code, size, hex)
        same(createDigest(code, hex ? fromHex(hex) : empty).bytes, buf)
      }
    })
    test('hash sha2-256', async () => {
      const hash = await sha256.digestBytes(fromString('test'))
      same(hash.code, sha256.code)
      same(hash.digest, encode('sha256')(fromString('test')))

      const hash2 = decodeDigest(hash.bytes)
      same(hash2.code, sha256.code)
      same(hash2.bytes, hash.bytes)
    })
    test('hash sha2-512', async () => {
      const hash = await sha512.digestBytes(fromString('test'))
      same(hash.code, sha512.code)
      same(hash.digest, encode('sha512')(fromString('test')))

      const hash2 = decodeDigest(hash.bytes)
      same(hash2.code, sha512.code)
      same(hash2.bytes, hash.bytes)
    })
  })
  describe('decode', () => {
    for (const { encoding, hex, size } of valid) {
      test(`valid fixture ${hex}`, () => {
        const { code, varint } = encoding
        const bytes = sample(varint || code, size, hex)
        const digest = hex ? fromHex(hex) : empty
        const hash = decodeDigest(bytes)

        same(hash.bytes, bytes)
        same(hash.code, code)
        same(hash.size, size)
        same(hash.digest, digest)
      })
    }

    test('get from buffer', async () => {
      const hash = await sha256.digestBytes(fromString('test'))

      same(hash.code, 18)
    })
  })
  describe('validate', async () => {
    test('invalid fixtures', async () => {
      for (const test of invalid) {
        const buff = fromHex(test.hex)
        await testThrowAsync(() => decodeDigest(buff), test.message)
      }
    })
  })
  test('throw on hashing non-buffer', async () => {
    await testThrowAsync(() => sha256.digestBytes('asdf'), 'Unknown type, must be binary type')
  })
  test('browser', () => {
    same(__browser, !!process.browser)
  })
})
