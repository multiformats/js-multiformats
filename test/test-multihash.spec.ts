/* globals describe, it */

import { hash as slSha256 } from '@stablelib/sha256'
import { hash as slSha512 } from '@stablelib/sha512'
import { assert } from 'aegir/chai'
import { sha1 as chSha1 } from 'crypto-hash'
import { fromHex, fromString } from '../src/bytes.js'
import { decode as decodeDigest, create as createDigest, hasCode as digestHasCode } from '../src/hashes/digest.js'
import { identity } from '../src/hashes/identity.js'
import { sha1 } from '../src/hashes/sha1.js'
import { sha256, sha512 } from '../src/hashes/sha2.js'
import invalid from './fixtures/invalid-multihash.js'
import valid from './fixtures/valid-multihash.js'
import type { MultihashDigest } from '../src/cid.js'

const sample = (code: number | string, size: number, hex: string): Uint8Array => {
  const toHex = (i: number | string): string => {
    if (typeof i === 'string') { return i }
    const h = i.toString(16)
    return h.length % 2 === 1 ? `0${h}` : h
  }
  return fromHex(`${toHex(code)}${toHex(size)}${hex}`)
}

describe('multihash', () => {
  const empty = new Uint8Array(0)

  describe('encode', () => {
    it('valid', () => {
      for (const test of valid) {
        const { encoding, hex, size } = test
        const { code, varint } = encoding
        const buf = sample(varint ?? code, size, hex)
        assert.deepStrictEqual(createDigest(code, (hex !== '') ? fromHex(hex) : empty).bytes, buf)
      }
    })

    it('hash sha1', async () => {
      const hash = await sha1.digest(fromString('test'))
      assert.deepStrictEqual(hash.code, sha1.code)
      assert.deepStrictEqual(hash.digest, fromHex(await chSha1(fromString('test'))))

      const hash2 = decodeDigest(hash.bytes)
      assert.deepStrictEqual(hash2.code, sha1.code)
      assert.deepStrictEqual(hash2.bytes, hash.bytes)
    })

    if (typeof navigator === 'undefined') {
      it('sync sha1', async () => {
        const hash = sha1.digest(fromString('test'))
        if (hash instanceof Promise) {
          assert.fail('expected sync result')
        } else {
          assert.deepStrictEqual(hash.code, sha1.code)
          assert.deepStrictEqual(hash.digest, fromHex(await chSha1(fromString('test'))))

          const hash2 = decodeDigest(hash.bytes)
          assert.deepStrictEqual(hash2.code, sha1.code)
          assert.deepStrictEqual(hash2.bytes, hash.bytes)
        }
      })
    }

    it('hash sha2-256', async () => {
      const hash = await sha256.digest(fromString('test'))
      assert.deepStrictEqual(hash.code, sha256.code)
      assert.deepStrictEqual(hash.digest, slSha256(fromString('test')))

      const hash2 = decodeDigest(hash.bytes)
      assert.deepStrictEqual(hash2.code, sha256.code)
      assert.deepStrictEqual(hash2.bytes, hash.bytes)
    })

    if (typeof navigator === 'undefined') {
      it('sync sha-256', () => {
        const hash = sha256.digest(fromString('test'))
        if (hash instanceof Promise) {
          assert.fail('expected sync result')
        } else {
          assert.deepStrictEqual(hash.code, sha256.code)
          assert.deepStrictEqual(hash.digest, slSha256(fromString('test')))

          const hash2 = decodeDigest(hash.bytes)
          assert.deepStrictEqual(hash2.code, sha256.code)
          assert.deepStrictEqual(hash2.bytes, hash.bytes)
        }
      })
    }

    it('hash sha2-512', async () => {
      const hash = await sha512.digest(fromString('test'))
      assert.deepStrictEqual(hash.code, sha512.code)
      assert.deepStrictEqual(hash.digest, slSha512(fromString('test')))

      const hash2 = decodeDigest(hash.bytes)
      assert.deepStrictEqual(hash2.code, sha512.code)
      assert.deepStrictEqual(hash2.bytes, hash.bytes)
    })

    it('hash identity async', async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const hash = await identity.digest(fromString('test'))
      assert.deepStrictEqual(hash.code, identity.code)
      assert.deepStrictEqual(identity.code, 0)
      assert.deepStrictEqual(hash.digest, fromString('test'))

      const hash2 = decodeDigest(hash.bytes)
      assert.deepStrictEqual(hash2.code, identity.code)
      assert.deepStrictEqual(hash2.bytes, hash.bytes)
    })

    it('hash identity sync', () => {
      const hash = identity.digest(fromString('test'))
      assert.deepStrictEqual(hash.code, identity.code)
      assert.deepStrictEqual(identity.code, 0)
      assert.deepStrictEqual(hash.digest, fromString('test'))

      const hash2 = decodeDigest(hash.bytes)
      assert.deepStrictEqual(hash2.code, identity.code)
      assert.deepStrictEqual(hash2.bytes, hash.bytes)
    })
  })
  describe('decode', () => {
    for (const { encoding, hex, size } of valid) {
      it(`valid fixture ${hex}`, () => {
        const { code, varint } = encoding
        const bytes = sample(varint ?? code, size, hex)
        const digest = (hex !== '') ? fromHex(hex) : empty
        const hash = decodeDigest(bytes)

        assert.deepStrictEqual(hash.bytes, bytes)
        assert.deepStrictEqual(hash.code, code)
        assert.deepStrictEqual(hash.size, size)
        assert.deepStrictEqual(hash.digest, digest)
      })
    }

    it('get from buffer', async () => {
      const hash = await sha256.digest(fromString('test'))

      assert.deepStrictEqual(hash.code, 18)
    })
  })

  describe('validate', async () => {
    it('invalid fixtures', async () => {
      for (const test of invalid) {
        const buff = fromHex(test.hex)
        assert.throws(() => decodeDigest(buff), test.message)
      }
    })
  })

  it('throw on hashing non-buffer', async () => {
    try {
      // @ts-expect-error - string is incompatible arg
      await sha256.digest('asdf')
    } catch (error) {
      assert.match(String(error), /Unknown type, must be binary type/)
    }
  })

  describe('hasCode', () => {
    it('asserts that a multihash has the expected code', () => {
      const buf = Uint8Array.from([0, 1, 2, 3])

      // remove code type from MultihashDigest
      const hash = decodeDigest(identity.digest(buf).bytes)

      // a function that requires a specific type of multihash
      function needIdentity (_: MultihashDigest<0x0>): void {

      }

      assert.isTrue(digestHasCode(hash, identity.code))

      // @ts-expect-error fails to compile as hash is MultihashDigest<number>
      needIdentity(hash)

      // hint to tsc that hash is MultihashDigest<0x0>
      if (digestHasCode(hash, identity.code)) {
        needIdentity(hash)
      }
    })
  })
})
