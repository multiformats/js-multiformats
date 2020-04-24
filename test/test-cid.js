/* eslint describe, it */
'use strict'
const crypto = require('crypto')
const test = it
const assert = require('assert')
const same = assert.deepStrictEqual

const testThrow = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}

describe('CID', () => {
  const { CID, multihash, multibase } = require('../')()
  multibase.add(require('../bases/base58'))
  multibase.add(require('../bases/base32'))
  const encode = data => crypto.createHash('sha256').update(data).digest()
  const name = 'sha2-256'
  const code = 18
  multihash.add([{ code, name, encode }])
  const b58 = multibase.get('base58btc')
  let hash

  before(async () => {
    hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
  })

  describe('v0', () => {
    test('handles B58Str multihash', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const cid = new CID(mhStr)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash, b58.decode(mhStr))

      same(cid.toString(), mhStr)
    })

    test('create by parts', () => {
      const cid = new CID(0, 112, hash)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash, hash)
      cid.toString()
      same(cid.toString(), b58.encode(hash))
    })

    test('throws on invalid BS58Str multihash ', () => {
      const msg = 'Non-base58 character'
      testThrow(() => new CID('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zIII'), msg)
    })

    test('throws on trying to create a CIDv0 with a codec other than dag-pb', () => {
      const msg = 'Version 0 CID must be 112 codec (dag-cbor)'
      testThrow(() => new CID(0, 113, hash), msg)
    })

    test('throws on trying to pass specific base encoding [deprecated]', () => {
      const msg = 'No longer supported, cannot specify base encoding in instantiation'
      testThrow(() => new CID(0, 112, hash, 'base32'), msg)
    })

    test('throws on trying to base encode CIDv0 in other base than base58btc', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const cid = new CID(mhStr)
      const msg = 'Cannot string encode V0 in base32 encoding'
      testThrow(() => cid.toString('base32'), msg)
    })

    test('.buffer', () => {
      const codec = 112
      const cid = new CID(0, codec, hash)
      const buffer = cid.buffer
      assert.ok(buffer)
      const str = buffer.toString('hex')
      same(str, '1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    })

    test('should construct from an old CID', () => {
      const cidStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const oldCid = new CID(cidStr)
      const newCid = new CID(oldCid)
      same(newCid.toString(), cidStr)
    })
  })

  describe('v1', () => {
    test('handles CID String (multibase encoded)', () => {
      const cidStr = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
      const cid = new CID(cidStr)
      same(cid.code, 112)
      same(cid.version, 1)
      assert.ok(cid.multihash)
      same(cid.toString(), multibase.encode(cid.buffer, 'base32'))
    })

    test('handles CID (no multibase)', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u'
      const cidBuf = Buffer.from('017012207252523e6591fb8fe553d67ff55a86f84044b46a3e4176e10c58fa529a4aabd5', 'hex')
      const cid = new CID(cidBuf)
      same(cid.code, 112)
      same(cid.version, 1)
      same(cid.toString(), cidStr)
    })

    test('create by parts', () => {
      const cid = new CID(1, 0x71, hash)
      same(cid.code, 0x71)
      same(cid.version, 1)
      same(cid.multihash, hash)
    })

    test('can roundtrip through cid.toBaseEncodedString()', () => {
      const cid1 = new CID(1, 0x71, hash)
      const cid2 = new CID(cid1.toString())

      same(cid1.codec, cid2.codec)
      same(cid1.version, cid2.version)
      same(cid1.multihash, cid2.multihash)
    })

    /* TODO: after i have a keccak hash for the new interface
    test('handles multibyte varint encoded codec codes', () => {
      const ethBlockHash = Buffer.from('8a8e84c797605fbe75d5b5af107d4220a2db0ad35fd66d9be3d38d87c472b26d', 'hex')
      const mh = multihash.encode(ethBlockHash, 'keccak-256')
      const cid1 = new CID(1, 'eth-block', mh)
      const cid2 = new CID(cid1.toBaseEncodedString())

      same(cid1).to.have.property('codec', 'eth-block')
      same(cid1).to.have.property('version', 1)
      same(cid1).to.have.property('multihash').that.eql(mh)
      same(cid1).to.have.property('multibaseName', 'base32')
      same(cid2).to.have.property('codec', 'eth-block')
      same(cid2).to.have.property('version', 1)
      same(cid2).to.have.property('multihash').that.eql(mh)
      same(cid2).to.have.property('multibaseName', 'base32')
    })
    */

    test('.buffer', () => {
      const code = 0x71
      const cid = new CID(1, code, hash)
      const buffer = cid.buffer
      assert.ok(buffer)
      same(buffer).to.exist()
      const str = buffer.toString('hex')
      same(str, '01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    })

    test('should construct from an old CID without a multibaseName', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u'
      const oldCid = new CID(cidStr)
      const newCid = new CID(oldCid)
      same(newCid.toString(), cidStr)
    })
  })

  describe('utilities', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const h2 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1o'

    test('.equals v0 to v0', () => {
      same(new CID(h1).equals(new CID(h1))).to.equal(true)
      same(new CID(h1).equals(new CID(h2))).to.equal(false)
    })

    test('.equals v0 to v1 and vice versa', () => {
      const cidV1Str = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
      const cidV1 = new CID(cidV1Str)
      const cidV0 = cidV1.toV0()

      same(cidV0.equals(cidV1)).to.equal(false)
      same(cidV1.equals(cidV0)).to.equal(false)
      same(cidV1.multihash).to.eql(cidV0.multihash)
    })

    test('.isCid', () => {
      same(
        CID.isCID(new CID(h1))
      ).to.equal(true)

      same(
        CID.isCID(false)
      ).to.equal(false)

      same(
        CID.isCID(Buffer.from('hello world'))
      ).to.equal(false)

      same(
        CID.isCID(new CID(h1).toV0())
      ).to.equal(true)

      same(
        CID.isCID(new CID(h1).toV1())
      ).to.equal(true)
    })
  })

  describe('throws on invalid inputs', () => {
    const invalid = [
      'hello world',
      'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L',
      Buffer.from('hello world'),
      Buffer.from('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT')
    ]

    invalid.forEach((i) => test(`new CID(${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`, () => {
      same(() => new CID(i)).to.throw()
    }))

    invalid.forEach((i) => test(`new CID(0, 'dag-pb', ${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`, () => {
      same(() => new CID(0, 'dag-pb', i)).to.throw()
    }))

    invalid.forEach((i) => test(`new CID(1, 'dag-pb', ${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`, () => {
      same(() => new CID(1, 'dag-pb', i)).to.throw()
    }))

    const invalidVersions = [-1, 2]
    invalidVersions.forEach((i) => test(`new CID(${i}, 'dag-pb', buffer)`, () => {
      same(() => new CID(i, 'dag-pb', hash)).to.throw()
    }))
  })

  describe('idempotence', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const cid1 = new CID(h1)
    const cid2 = new CID(cid1)

    test('constructor accept constructed instance', () => {
      same(cid1.equals(cid2)).to.equal(true)
      same(cid1 === cid2).to.equal(false)
    })
  })

  describe('conversion v0 <-> v1', () => {
    test('should convert v0 to v1', async () => {
      const hash = await multihashing(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = new CID(0, 'dag-pb', hash).toV1()
      same(cid.version).to.equal(1)
    })

    test('should convert v1 to v0', async () => {
      const hash = await multihashing(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = new CID(1, 'dag-pb', hash).toV0()
      same(cid.version).to.equal(0)
    })

    test('should not convert v1 to v0 if not dag-pb codec', async () => {
      const hash = await multihashing(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = new CID(1, 'dag-cbor', hash)
      same(() => cid.toV0()).to.throw('Cannot convert a non dag-pb CID to CIDv0')
    })

    test('should not convert v1 to v0 if not sha2-256 multihash', async () => {
      const hash = await multihashing(Buffer.from(`TEST${Date.now()}`), 'sha2-512')
      const cid = new CID(1, 'dag-pb', hash)
      same(() => cid.toV0()).to.throw('Cannot convert non sha2-256 multihash CID to CIDv0')
    })

    test('should not convert v1 to v0 if not 32 byte multihash', async () => {
      const hash = await multihashing(Buffer.from(`TEST${Date.now()}`), 'sha2-256', 31)
      const cid = new CID(1, 'dag-pb', hash)
      same(() => cid.toV0()).to.throw('Cannot convert non 32 byte multihash CID to CIDv0')
    })
  })

  describe('caching', () => {
    test('should cache CID as buffer', async () => {
      const hash = await multihashing(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = new CID(1, 'dag-pb', hash)
      same(cid.buffer).to.equal(cid.buffer)
      // Make sure custom implementation detail properties don't leak into
      // the prototype
      same(Object.prototype.hasOwnProperty.call(cid, 'buffer')).to.be.false()
    })
    test('should cache string representation when it matches the multibaseName it was constructed with', () => {
      // not string to cache yet
      const cid = new CID(1, 'dag-pb', hash, 'base32')
      same(cid.string).to.be.undefined()

      // we dont cache alternate base encodings yet.
      same(cid.toBaseEncodedString('base64')).to.equal('mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
      same(cid.string).to.be.undefined()

      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu'
      same(cid.toBaseEncodedString()).to.equal(base32String)

      // it cached!
      same(cid.string).to.equal(base32String)
      // Make sure custom implementation detail properties don't leak into
      // the prototype
      same(Object.prototype.hasOwnProperty.call(cid, '_string')).to.be.false()
      same(cid.toBaseEncodedString()).to.equal(base32String)
      same(cid.toBaseEncodedString('base64')).to.equal('mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')

      // alternate base not cached!
      same(cid.string).to.equal(base32String)
    })
    test('should cache string representation when constructed with one', () => {
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu'
      const cid = new CID(base32String)
      same(cid.string).to.equal(base32String)
      same(cid.toBaseEncodedString('base64')).to.equal('mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
      same(cid.string).to.equal(base32String)
      same(cid.toBaseEncodedString()).to.equal(base32String)
    })
  })
})
