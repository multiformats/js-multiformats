/* globals describe, it */

import * as Link from 'multiformats/link'
import { CID } from 'multiformats'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { sha256 } from 'multiformats/hashes/sha2'
// import { code as PB } from '@ipld/dag-pb'

chai.use(chaiAsPromised)
const { assert } = chai

const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
// const h2 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1o'
// const h3 = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
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
    assert.equal(CID.isCID(CID.parse(h1)), true)
    assert.equal(CID.isCID(CID.parse(h1).toV0()), true)

    assert.equal(CID.isCID(CID.parse(h1).toV1()), true)
  })

  describe('create', () => {})

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
})
