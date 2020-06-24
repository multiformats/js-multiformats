/* globals before, describe, it */
import crypto from 'crypto'
import OLDCID from 'cids'
import assert from 'assert'
import { toHex } from 'multiformats/bytes.js'
import multiformats from 'multiformats/basics.js'
import base58 from 'multiformats/bases/base58.js'
import base32 from 'multiformats/bases/base32.js'
import base64 from 'multiformats/bases/base64.js'
import util from 'util'
const test = it
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
const testThrowAny = async fn => {
  try {
    await fn()
  } catch (e) {
    return
  }
  throw new Error('Test failed to throw')
}

describe('CID', () => {
  const { CID, multihash, multibase, varint } = multiformats
  multibase.add(base58)
  multibase.add(base32)
  multibase.add(base64)
  const hashes = [
    {
      encode: data => crypto.createHash('sha256').update(data).digest(),
      name: 'sha2-256',
      code: 0x12
    },
    {
      encode: data => crypto.createHash('sha512').update(data).digest(),
      name: 'sha2-512',
      code: 0x13
    }
  ]
  multihash.add(hashes)
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
      const str = toHex(buffer)
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

    test('can roundtrip through cid.toString()', () => {
      const cid1 = new CID(1, 0x71, hash)
      const cid2 = new CID(cid1.toString())

      same(cid1.code, cid2.code)
      same(cid1.version, cid2.version)
      same(cid1.multihash, cid2.multihash)
    })

    /* TODO: after i have a keccak hash for the new interface
    test('handles multibyte varint encoded codec codes', () => {
      const ethBlockHash = Buffer.from('8a8e84c797605fbe75d5b5af107d4220a2db0ad35fd66d9be3d38d87c472b26d', 'hex')
      const mh = multihash.encode(ethBlockHash, 'keccak-256')
      const cid1 = new CID(1, 'eth-block', mh)
      const cid2 = new CID(cid1.toBaseEncodedString())

      same(cid1.codec, 'eth-block')
      same(cid1.version, 1)
      same(cid1.multihash, mh)
      same(cid1.multibaseName, 'base32')
      same(cid2.code, )
      same(cid2.version, 1)
      same(cid2.multihash, mh)
    })
    */

    test('.buffer', () => {
      const code = 0x71
      const cid = new CID(1, code, hash)
      const buffer = cid.buffer
      assert.ok(buffer)
      const str = toHex(buffer)
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
      same(new CID(h1).equals(new CID(h1)), true)
      same(new CID(h1).equals(new CID(h2)), false)
    })

    test('.equals v0 to v1 and vice versa', () => {
      const cidV1Str = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
      const cidV1 = new CID(cidV1Str)
      const cidV0 = cidV1.toV0()

      same(cidV0.equals(cidV1), false)
      same(cidV1.equals(cidV0), false)
      same(cidV1.multihash, cidV0.multihash)
    })

    test('.isCid', () => {
      assert.ok(CID.isCID(new CID(h1)))

      assert.ok(!CID.isCID(false))

      assert.ok(!CID.isCID(Buffer.from('hello world')))

      assert.ok(CID.isCID(new CID(h1).toV0()))

      assert.ok(CID.isCID(new CID(h1).toV1()))
    })

    test('works with deepEquals', () => {
      const ch1 = new CID(h1)
      ch1._baseCache.set('herp', 'derp')
      assert.deepStrictEqual(ch1, new CID(h1))
      assert.notDeepStrictEqual(ch1, new CID(h2))
    })
  })

  describe('throws on invalid inputs', () => {
    const invalid = [
      'hello world',
      'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L',
      Buffer.from('hello world'),
      Buffer.from('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT')
    ]

    let mapper = i => {
      const name = `new CID(${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`
      test(name, () => testThrowAny(() => new CID(i)))
    }
    invalid.forEach(mapper)

    mapper = i => {
      const name = `new CID(0, 112, ${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`
      test(name, () => testThrowAny(() => new CID(0, 112, i)))
    }
    invalid.forEach(mapper)

    mapper = i => {
      const name = `new CID(1, 112, ${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`
      test(name, () => testThrowAny(() => new CID(1, 112, i)))
    }
    invalid.forEach(mapper)

    const invalidVersions = [-1, 2]
    mapper = i => {
      const name = `new CID(${i}, 112, buffer)`
      test(name, () => testThrowAny(new CID(i, 112, hash)))
    }
    invalidVersions.forEach(mapper)
  })

  describe('idempotence', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const cid1 = new CID(h1)
    const cid2 = new CID(cid1)

    test('constructor accept constructed instance', () => {
      same(cid1.equals(cid2), true)
      same(cid1 === cid2, false)
    })
  })

  describe('conversion v0 <-> v1', () => {
    test('should convert v0 to v1', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = (new CID(0, 112, hash)).toV1()
      same(cid.version, 1)
    })

    test('should convert v1 to v0', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = (new CID(1, 112, hash)).toV0()
      same(cid.version, 0)
    })

    test('should not convert v1 to v0 if not dag-pb codec', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = new CID(1, 0x71, hash)
      await testThrow(() => cid.toV0(), 'Cannot convert a non dag-pb CID to CIDv0')
    })

    test('should not convert v1 to v0 if not sha2-256 multihash', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-512')
      const cid = new CID(1, 112, hash)
      await testThrow(() => cid.toV0(), 'Cannot convert non sha2-256 multihash CID to CIDv0')
    })
  })

  describe('caching', () => {
    test('should cache CID as buffer', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = new CID(1, 112, hash)
      assert.ok(cid.buffer)
      same(cid.buffer, cid.buffer)
    })
    test('should cache string representation when it matches the multibaseName it was constructed with', () => {
      const cid = new CID(1, 112, hash)
      same(cid._baseCache.size, 0)

      same(cid.toString('base64'), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
      same(cid._baseCache.get('base64'), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')

      same(cid._baseCache.has('base32'), false)

      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu'
      same(cid.toString(), base32String)

      same(cid._baseCache.get('base32'), base32String)
      same(cid.toString('base64'), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
    })
    test('should cache string representation when constructed with one', () => {
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu'
      const cid = new CID(base32String)
      same(cid._baseCache.get('base32'), base32String)
    })
  })

  test('toJSON()', () => {
    const cid = new CID(1, 112, hash)
    same(cid.toJSON(), { code: 112, version: 1, hash })
  })

  test('isCID', () => {
    const cid = new CID(1, 112, hash)
    assert.ok(OLDCID.isCID(cid))
  })
  test('new CID from old CID', () => {
    const cid = new CID(new OLDCID(1, 'raw', Buffer.from(hash)))
    same(cid.version, 1)
    same(cid.multihash, hash)
    same(cid.code, 85)
  })

  if (!process.browser) {
    test('util.inspect', () => {
      const cid = new CID(1, 112, hash)
      same(util.inspect(cid), 'CID(bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu)')
    })
  }

  describe('deprecations', () => {
    test('codec', async () => {
      const cid = new CID(1, 112, hash)
      await testThrow(() => cid.codec, '"codec" property is deprecated, use integer "code" property instead')
      await testThrow(() => new CID(1, 'dag-pb', hash), 'String codecs are no longer supported')
    })
    test('multibaseName', async () => {
      const cid = new CID(1, 112, hash)
      await testThrow(() => cid.multibaseName, '"multibaseName" property is deprecated')
    })
    test('prefix', async () => {
      const cid = new CID(1, 112, hash)
      await testThrow(() => cid.prefix, '"prefix" property is deprecated')
    })
    test('toBaseEncodedString()', async () => {
      const cid = new CID(1, 112, hash)
      await testThrow(() => cid.toBaseEncodedString(), 'Deprecated, use .toString()')
    })
  })

  test('invalid CID version', async () => {
    const encoded = varint.encode(18)
    await testThrow(() => new CID(encoded), 'Invalid CID version 18')
  })
})
