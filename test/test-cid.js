/* globals describe, it */
import crypto from 'crypto'
import OLDCID from 'cids'
import assert from 'assert'
import { toHex, equals } from 'multiformats/bytes.js'
import multiformats from 'multiformats/basics.js'
import base58 from 'multiformats/bases/base58.js'
import base32 from 'multiformats/bases/base32.js'
import base64 from 'multiformats/bases/base64.js'
import util from 'util'
const test = it
const same = assert.deepStrictEqual

// eslint-disable-next-line no-unused-vars

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

  describe('v0', () => {
    test('handles B58Str multihash', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const cid = CID.from(mhStr)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash, b58.decode(mhStr))

      same(cid.toString(), mhStr)
    })

    test('create by parts', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(0, 112, hash)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash, hash)
      cid.toString()
      same(cid.toString(), b58.encode(hash))
    })

    test('create from multihash', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.from(hash)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash, hash)
      cid.toString()
      same(cid.toString(), b58.encode(hash))
    })

    test('throws on invalid BS58Str multihash ', async () => {
      const msg = 'Non-base58 character'
      testThrow(() => CID.from('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zIII'), msg)
    })

    test('throws on trying to create a CIDv0 with a codec other than dag-pb', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const msg = 'Version 0 CID must be 112 codec (dag-cbor)'
      testThrow(() => CID.create(0, 113, hash), msg)
    })

    test('throws on trying to pass specific base encoding [deprecated]', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const msg = 'No longer supported, cannot specify base encoding in instantiation'
      testThrow(() => CID.create(0, 112, hash, 'base32'), msg)
    })

    test('throws on trying to base encode CIDv0 in other base than base58btc', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const cid = CID.from(mhStr)
      const msg = 'Cannot string encode V0 in base32 encoding'
      testThrow(() => cid.toString('base32'), msg)
    })

    test('.bytes', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const codec = 112
      const cid = CID.create(0, codec, hash)
      const bytes = cid.bytes
      assert.ok(bytes)
      const str = toHex(bytes)
      same(str, '1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    })

    test('should construct from an old CID', () => {
      const cidStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const oldCid = CID.from(cidStr)
      const newCid = CID.from(oldCid)
      same(newCid.toString(), cidStr)
    })
  })

  describe('v1', () => {
    test('handles CID String (multibase encoded)', () => {
      const cidStr = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
      const cid = CID.from(cidStr)
      same(cid.code, 112)
      same(cid.version, 1)
      assert.ok(cid.multihash)
      same(cid.toString(), multibase.encode(cid.bytes, 'base32'))
    })

    test('handles CID (no multibase)', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u'
      const cidBuf = Buffer.from('017012207252523e6591fb8fe553d67ff55a86f84044b46a3e4176e10c58fa529a4aabd5', 'hex')
      const cid = CID.from(cidBuf)
      same(cid.code, 112)
      same(cid.version, 1)
      same(cid.toString(), cidStr)
    })

    test('create by parts', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 0x71, hash)
      same(cid.code, 0x71)
      same(cid.version, 1)
      assert.ok(equals(cid.multihash, hash))
    })

    test('can roundtrip through cid.toString()', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid1 = CID.create(1, 0x71, hash)
      const cid2 = CID.from(cid1.toString())

      same(cid1.code, cid2.code)
      same(cid1.version, cid2.version)
      same(cid1.multihash, cid2.multihash)
    })

    /* TODO: after i have a keccak hash for the new interface
    test('handles multibyte varint encoded codec codes', () => {
      const ethBlockHash = Buffer.from('8a8e84c797605fbe75d5b5af107d4220a2db0ad35fd66d9be3d38d87c472b26d', 'hex')
      const mh = multihash.encode(ethBlockHash, 'keccak-256')
      const cid1 = CID.create(1, 'eth-block', mh)
      const cid2 = CID.from(cid1.toBaseEncodedString())

      same(cid1.codec, 'eth-block')
      same(cid1.version, 1)
      same(cid1.multihash, mh)
      same(cid1.multibaseName, 'base32')
      same(cid2.code, )
      same(cid2.version, 1)
      same(cid2.multihash, mh)
    })
    */

    test('.bytes', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const code = 0x71
      const cid = CID.create(1, code, hash)
      const bytes = cid.bytes
      assert.ok(bytes)
      const str = toHex(bytes)
      same(str, '01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    })

    test('should construct from an old CID without a multibaseName', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u'
      const oldCid = CID.from(cidStr)
      const newCid = CID.from(oldCid)
      same(newCid.toString(), cidStr)
    })
  })

  describe('utilities', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const h2 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1o'

    test('.equals v0 to v0', () => {
      same(CID.from(h1).equals(CID.from(h1)), true)
      same(CID.from(h1).equals(CID.from(h2)), false)
    })

    test('.equals v0 to v1 and vice versa', () => {
      const cidV1Str = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
      const cidV1 = CID.from(cidV1Str)
      const cidV0 = cidV1.toV0()

      same(cidV0.equals(cidV1), false)
      same(cidV1.equals(cidV0), false)

      same(cidV1.multihash, cidV0.multihash)
    })

    test('.isCid', () => {
      assert.ok(CID.isCID(CID.from(h1)))

      assert.ok(!CID.isCID(false))

      assert.ok(!CID.isCID(Buffer.from('hello world')))

      assert.ok(CID.isCID(CID.from(h1).toV0()))

      assert.ok(CID.isCID(CID.from(h1).toV1()))
    })

    test('works with deepEquals', () => {
      const ch1 = CID.from(h1)
      ch1._baseCache.set('herp', 'derp')
      assert.deepStrictEqual(ch1, CID.from(h1))
      assert.notDeepStrictEqual(ch1, CID.from(h2))
    })
  })

  describe('throws on invalid inputs', () => {
    const from = [
      'hello world',
      'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L',
      Buffer.from('hello world'),
      Buffer.from('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT'),
      {}
    ]

    for (const i of from) {
      const name = `CID.from(${Buffer.isBuffer(i) ? 'buffer' : 'string'}<${i.toString()}>)`
      test(name, () => testThrowAny(() => CID.from(i)))
    }

    const create = [
      ...from.map(i => [0, 112, i]),
      ...from.map(i => [1, 112, i]),
      [18, 112, 'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L']
    ]

    for (const [version, code, hash] of create) {
      const name = `CID.create(${version}, ${code}, ${Buffer.isBuffer(hash) ? 'buffer' : 'string'}<${hash.toString()}>)`
      test(name, () => testThrowAny(() => CID.create(version, code, hash)))
    }
  })

  describe('idempotence', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const cid1 = CID.from(h1)
    const cid2 = CID.from(cid1)

    test('constructor accept constructed instance', () => {
      same(cid1.equals(cid2), true)
      same(cid1 === cid2, false)
    })
  })

  describe('conversion v0 <-> v1', () => {
    test('should convert v0 to v1', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = (CID.create(0, 112, hash)).toV1()
      same(cid.version, 1)
    })

    test('should convert v1 to v0', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = (CID.create(1, 112, hash)).toV0()
      same(cid.version, 0)
    })

    test('should not convert v1 to v0 if not dag-pb codec', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = CID.create(1, 0x71, hash)
      await testThrow(() => cid.toV0(), 'Cannot convert a non dag-pb CID to CIDv0')
    })

    test('should not convert v1 to v0 if not sha2-256 multihash', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-512')
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.toV0(), 'Cannot convert non sha2-256 multihash CID to CIDv0')
    })
  })

  describe('caching', () => {
    test('should cache CID as buffer', async () => {
      const hash = await multihash.hash(Buffer.from(`TEST${Date.now()}`), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      assert.ok(cid.bytes)
      same(cid.bytes, cid.bytes)
    })
    test('should cache string representation when it matches the multibaseName it was constructed with', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
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
      const cid = CID.from(base32String)
      same(cid._baseCache.get('base32'), base32String)
    })
  })

  test('toJSON()', async () => {
    const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
    const cid = CID.create(1, 112, hash)
    const json = cid.toJSON()

    same({ ...json, hash: null }, { code: 112, version: 1, hash: null })
    assert.ok(equals(json.hash, hash))
  })

  test('isCID', async () => {
    const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
    const cid = CID.create(1, 112, hash)
    assert.strictEqual(OLDCID.isCID(cid), false)
  })

  test('asCID', async () => {
    const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
    class IncompatibleCID {
      constructor (version, code, multihash) {
        this.version = version
        this.code = code
        this.multihash = multihash
        this.asCID = this
      }

      get [Symbol.for('@ipld/js-cid/CID')] () {
        return true
      }
    }

    const version = 1
    const code = 112
    const _multihash = hash

    const incompatibleCID = new IncompatibleCID(version, code, _multihash)
    assert.ok(CID.isCID(incompatibleCID))
    assert.strictEqual(incompatibleCID.toString(), '[object Object]')
    assert.strictEqual(typeof incompatibleCID.toV0, 'undefined')

    const cid1 = CID.asCID(incompatibleCID)
    assert.ok(cid1 instanceof CID)
    assert.strictEqual(cid1.code, code)
    assert.strictEqual(cid1.version, version)
    assert.ok(equals(cid1.multihash, _multihash))

    const cid2 = CID.asCID({ version, code, _multihash })
    assert.strictEqual(cid2, null)

    const duckCID = { version, code, multihash: _multihash }
    duckCID.asCID = duckCID
    const cid3 = CID.asCID(duckCID)
    assert.ok(cid3 instanceof CID)
    assert.strictEqual(cid3.code, code)
    assert.strictEqual(cid3.version, version)
    assert.ok(equals(cid3.multihash, _multihash))

    const cid4 = CID.asCID(cid3)
    assert.strictEqual(cid3, cid4)

    const cid5 = CID.asCID(new OLDCID(1, 'raw', Buffer.from(hash)))
    assert.ok(cid5 instanceof CID)
    assert.strictEqual(cid5.version, 1)
    assert.ok(equals(cid5.multihash, hash))
    assert.strictEqual(cid5.code, 85)
  })

  test('new CID from old CID', async () => {
    const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
    const cid = CID.from(new OLDCID(1, 'raw', Buffer.from(hash)))
    same(cid.version, 1)

    assert.ok(equals(cid.multihash, hash))
    same(cid.code, 85)
  })

  if (!process.browser) {
    test('util.inspect', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      same(util.inspect(cid), 'CID(bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu)')
    })
  }

  describe('deprecations', async () => {
    test('codec', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.codec, '"codec" property is deprecated, use integer "code" property instead')
      await testThrow(() => CID.create(1, 'dag-pb', hash), 'String codecs are no longer supported')
    })
    test('multibaseName', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.multibaseName, '"multibaseName" property is deprecated')
    })
    test('prefix', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.prefix, '"prefix" property is deprecated')
    })
    test('toBaseEncodedString()', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.toBaseEncodedString(), 'Deprecated, use .toString()')
    })
    test('buffer', async () => {
      const hash = await multihash.hash(Buffer.from('abc'), 'sha2-256')
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.buffer, 'Deprecated .buffer property, use .bytes to get Uint8Array instead')
    })
  })

  test('invalid CID version', async () => {
    const encoded = varint.encode(2)
    await testThrow(() => CID.from(encoded), 'Invalid CID version 2')
  })
})
