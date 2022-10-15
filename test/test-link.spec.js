/* globals describe, it */

import * as Link from '../src/link.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { sha256 } from '../src/hashes/sha2.js'
import { base32 } from '../src/bases/base32.js'
import { base64 } from '../src/bases/base64.js'
import { base58btc } from '../src/bases/base58.js'
import { equals } from '../src/bytes.js'

chai.use(chaiAsPromised)
const { assert } = chai
const utf8 = new TextEncoder()

const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
const h4 = 'bafyreidykglsfhoixmivffc5uwhcgshx4j465xwqntbmu43nb2dzqwfvae'
const CBOR = 0x71
// eslint-disable-next-line
const SHA256 = sha256.code

const sh1 = /** @type {Link.MultihashDigest<typeof sha256.code>} */ (
  Link.parse(h4).multihash
)

describe('Link', () => {
  it('isLink', () => {
    assert.equal(Link.isLink(0), false)
    assert.equal(Link.isLink(false), false)
  })

  describe('create', () => {
    it('create v1', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.create(0x71, hash)
      /** @type {0x71} */
      const code = link.code
      assert.deepStrictEqual(code, 0x71)

      /** @type {1} */
      const version = link.version
      assert.deepEqual(version, 1)

      /** @type {Link.MultihashDigest<typeof sha256.code>}> */
      const multihash = link.multihash
      assert.deepStrictEqual(multihash, hash)
    })

    it('create v0', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.createLegacy(hash)

      /** @type {0x70} */
      const code = link.code
      assert.deepStrictEqual(code, 0x70)

      /** @type {0} */
      const version = link.version
      assert.deepEqual(version, 0)

      /** @type {Link.MultihashDigest<typeof sha256.code>}> */
      const multihash = link.multihash
      assert.deepStrictEqual(multihash, hash)
    })
  })

  describe('parse', () => {
    it('can parse any string', () => {
      const link = Link.parse(h1)

      /** @type {Link.Link<unknown, typeof CBOR, typeof SHA256, 1>} */
      // @ts-expect-error - types can not be inferred
      const t1 = link
      assert.ok(t1)

      // it is possible to manually cast
      const t2 = /** @type {Link.LegacyLink<unknown>} */ (link)
      assert.ok(t2)
    })

    it('parse retains type info', () => {
      const original = Link.create(CBOR, sh1)
      const source = Link.format(original)
      const link = Link.parse(source)
      assert.equal(original.equals(link), true, 'format -> parse roundtrips')

      // ensure that type info is retained
      /** @type {Link.Link<unknown, typeof CBOR, typeof SHA256, 1>} */
      const t1 = link
      assert.ok(t1)

      // ensurate that you can't cast incorrectly
      const t2 =
        // @ts-expect-error - version is 1 not 0
        /** @type {Link.Link<unknown, typeof CBOR, typeof SHA256, 0>} */ (link)
      assert.ok(t2)
    })
  })

  describe('toString', () => {
    it('throws on trying to base encode legacy links in other base than base58btc', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.createLegacy(hash)

      const msg = 'Cannot string encode V0 in base32 encoding'
      assert.throws(() => link.toString(base32), msg)
    })

    it('encode legacy links in base base58btc', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.createLegacy(hash)

      assert.equal(link.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY')
      assert.equal(link.toString(base58btc), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY')
    })

    it('encode v1 links', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.create(0x71, hash)

      assert.equal(link.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu')
      assert.equal(link.toString(base58btc), 'zdpuAxyLXBdHyrzwJpctQJpxH6cnuEAQwbf8VSWJ5NL5JPEjN')
      assert.equal(link.toString(base32), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu')
      assert.equal(link.toString(base64), 'mAXESILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
    })
  })

  describe('link', () => {
    it('.link() should return this v0 Link', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.createLegacy(hash)

      assert.equal(link, link.link())
    })

    it('.link() should return this v1 Link', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.create(0x71, hash)

      assert.equal(link, link.link())
    })
  })

  describe('toJSON', () => {
    it('toJSON() v0 Link', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.createLegacy(hash)
      const json = link.toJSON()

      assert.deepStrictEqual(
        { ...json, hash: null },
        { code: 0x70, version: 0, hash: null }
      )
      assert.ok(equals(json.hash, hash.bytes))
    })

    it('toJSON() v1 Link', async () => {
      const hash = await sha256.digest(utf8.encode('abc'))
      const link = Link.create(0x71, hash)
      const json = link.toJSON()

      assert.deepStrictEqual(
        { ...json, hash: null },
        { code: 0x71, version: 1, hash: null }
      )
      assert.ok(equals(json.hash, hash.bytes))
    })
  })
})

describe('decode', () => {
  it('decode', async () => {
    const hash = await sha256.digest(utf8.encode('abc'))
    const { bytes } = Link.create(0x71, hash)

    const link = Link.decode(bytes)

    /** @type {0x71} */
    const code = link.code
    assert.deepStrictEqual(code, 0x71)

    /** @type {1} */
    const version = link.version
    assert.deepEqual(version, 1)

    /** @type {Link.MultihashDigest<typeof sha256.code>}> */
    const multihash = link.multihash
    assert.deepStrictEqual(multihash, hash)
  })
})
