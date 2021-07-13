/* globals describe, it */

import OLDCID from 'cids'
import assert from 'assert'
import { fromHex, toHex, equals } from '../src/bytes.js'
import { varint, CID } from 'multiformats'
import { base58btc } from 'multiformats/bases/base58'
import { base32 } from 'multiformats/bases/base32'
import { base64 } from 'multiformats/bases/base64'
import { sha256, sha512 } from 'multiformats/hashes/sha2'
import util from 'util'
import { Buffer } from 'buffer'
import invalidMultihash from './fixtures/invalid-multihash.js'
import testThrow from './fixtures/test-throw.js'

const test = it

const same = (actual, expected) => {
  if (actual instanceof Uint8Array && expected instanceof Uint8Array) {
    if (Buffer.compare(Buffer.from(actual), Buffer.from(expected)) === 0) return
  }
  return assert.deepStrictEqual(actual, expected)
}

const testThrowAny = async fn => {
  try {
    await fn()
  } catch (e) {
    return
  }
  /* c8 ignore next */
  throw new Error('Test failed to throw')
}

describe('CID', () => {
  describe('v0', () => {
    test('handles B58Str multihash', () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const cid = CID.parse(mhStr)

      same(cid.version, 0)
      same(cid.code, 112)
      same(cid.multihash.bytes, base58btc.baseDecode(mhStr))

      same(cid.toString(), mhStr)
    })

    test('create by parts', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(0, 112, hash)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash, hash)
      same(cid.toString(), base58btc.baseEncode(hash.bytes))
    })

    test('create from multihash', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))

      const cid = CID.decode(hash.bytes)

      same(cid.code, 112)
      same(cid.version, 0)
      same(cid.multihash.digest, hash.digest)
      same({ ...cid.multihash, digest: null }, { ...hash, digest: null })
      cid.toString()
      same(cid.toString(), base58btc.baseEncode(hash.bytes))
    })

    test('throws on invalid BS58Str multihash ', async () => {
      const msg = 'Non-base58btc character'
      await testThrow(() => CID.parse('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zIII'), msg)
    })

    test('throws on trying to create a CIDv0 with a codec other than dag-pb', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const msg = 'Version 0 CID must use dag-pb (code: 112) block encoding'
      await testThrow(() => CID.create(0, 113, hash), msg)
    })

    // This was failing for quite some time, test just missed await so it went
    // unnoticed. Not sure we still care about checking fourth argument.
    // test('throws on trying to pass specific base encoding [deprecated]', async () => {
    //   const hash = await sha256.digest(Buffer.from('abc'))
    //   const msg = 'No longer supported, cannot specify base encoding in instantiation'
    //   await testThrow(() => CID.create(0, 112, hash, 'base32'), msg)
    // })

    test('throws on trying to base encode CIDv0 in other base than base58btc', async () => {
      const mhStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const cid = CID.parse(mhStr)
      const msg = 'Cannot string encode V0 in base32 encoding'
      await testThrow(() => cid.toString(base32), msg)
    })

    test('.bytes', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const codec = 112
      const cid = CID.create(0, codec, hash)
      const bytes = cid.bytes
      assert.ok(bytes)
      const str = toHex(bytes)
      same(str, '1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    })

    test('should construct from an old CID', () => {
      const cidStr = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
      const oldCid = CID.parse(cidStr)
      const newCid = CID.asCID(oldCid)
      same(newCid.toString(), cidStr)
    })

    test('inspect bytes', () => {
      const byts = fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
      const inspected = CID.inspectBytes(byts.subarray(0, 10)) // should only need the first few bytes
      same({
        version: 0,
        codec: 0x70,
        multihashCode: 0x12,
        multihashSize: 34,
        digestSize: 32,
        size: 34
      }, inspected)
    })

    describe('decodeFirst', () => {
      test('no remainder', () => {
        const byts = fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
        const [cid, remainder] = CID.decodeFirst(byts)
        same(cid.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY')
        same(remainder.byteLength, 0)
      })

      test('remainder', () => {
        const byts = fromHex('1220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad0102030405')
        const [cid, remainder] = CID.decodeFirst(byts)
        same(cid.toString(), 'QmatYkNGZnELf8cAGdyJpUca2PyY4szai3RHyyWofNY1pY')
        same(toHex(remainder), '0102030405')
      })
    })
  })

  describe('v1', () => {
    test('handles CID String (multibase encoded)', () => {
      const cidStr = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'
      const cid = CID.parse(cidStr)
      same(cid.code, 112)
      same(cid.version, 1)
      assert.ok(cid.multihash)
      same(cid.toString(), base32.encode(cid.bytes))
    })

    test('handles CID (no multibase)', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u'
      const cidBuf = Buffer.from('017012207252523e6591fb8fe553d67ff55a86f84044b46a3e4176e10c58fa529a4aabd5', 'hex')
      const cid = CID.decode(cidBuf)
      same(cid.code, 112)
      same(cid.version, 1)
      same(cid.toString(), cidStr)
    })

    test('create by parts', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 0x71, hash)
      same(cid.code, 0x71)
      same(cid.version, 1)
      assert.ok(equals(cid.multihash, hash))
    })

    test('can roundtrip through cid.toString()', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid1 = CID.create(1, 0x71, hash)
      const cid2 = CID.parse(cid1.toString())

      same(cid1.code, cid2.code)
      same(cid1.version, cid2.version)
      same(cid1.multihash.digest, cid2.multihash.digest)
      same(cid1.multihash.bytes, cid2.multihash.bytes)
      const clear = { digest: null, bytes: null }
      same({ ...cid1.multihash, ...clear }, { ...cid2.multihash, ...clear })
    })

    /* TODO: after i have a keccak hash for the new interface
    test('handles multibyte varint encoded codec codes', () => {
      const ethBlockHash = Buffer.from('8a8e84c797605fbe75d5b5af107d4220a2db0ad35fd66d9be3d38d87c472b26d', 'hex')
      const hash = keccak256.digest(ethBlockHash)
      const cid1 = CID.create(1, 0x90, hash)
      const cid2 = CID.parse(cid1.toString())

      same(cid1.code, 0x90)
      same(cid1.version, 1)
      same(cid1.multihash, hash)

      same(cid2.code, 0x90)
      same(cid2.version, 1)
      same(cid2.multihash, hash)
    })
    */

    test('.bytes', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const code = 0x71
      const cid = CID.create(1, code, hash)
      const bytes = cid.bytes
      assert.ok(bytes)
      const str = toHex(bytes)
      same(str, '01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    })

    test('should construct from an old CID without a multibaseName', () => {
      const cidStr = 'bafybeidskjjd4zmr7oh6ku6wp72vvbxyibcli2r6if3ocdcy7jjjusvl2u'
      const oldCid = CID.parse(cidStr)
      const newCid = CID.asCID(oldCid)
      same(newCid.toString(), cidStr)
    })
  })

  describe('utilities', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const h2 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1o'
    const h3 = 'zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS'

    test('.equals v0 to v0', () => {
      const cid1 = CID.parse(h1)
      same(cid1.equals(CID.parse(h1)), true)
      same(cid1.equals(CID.create(cid1.version, cid1.code, cid1.multihash)), true)

      const cid2 = CID.parse(h2)
      same(cid1.equals(CID.parse(h2)), false)
      same(cid1.equals(CID.create(cid2.version, cid2.code, cid2.multihash)), false)
    })

    test('.equals v0 to v1 and vice versa', () => {
      const cidV1 = CID.parse(h3)

      const cidV0 = cidV1.toV0()

      same(cidV0.equals(cidV1), false)
      same(cidV1.equals(cidV0), false)

      same(cidV1.multihash, cidV0.multihash)
    })

    test('.equals v1 to v1', () => {
      const cid1 = CID.parse(h3)

      same(cid1.equals(CID.parse(h3)), true)
      same(cid1.equals(CID.create(cid1.version, cid1.code, cid1.multihash)), true)
    })

    test('.isCid', () => {
      assert.ok(CID.isCID(CID.parse(h1)))

      assert.ok(!CID.isCID(false))

      assert.ok(!CID.isCID(Buffer.from('hello world')))

      assert.ok(CID.isCID(CID.parse(h1).toV0()))

      assert.ok(CID.isCID(CID.parse(h1).toV1()))
    })

    test('works with deepEquals', () => {
      const ch1 = CID.parse(h1)
      ch1._baseCache.set('herp', 'derp')
      assert.deepStrictEqual(ch1, CID.parse(h1))
      assert.notDeepStrictEqual(ch1, CID.parse(h2))
    })
  })

  describe('throws on invalid inputs', () => {
    const parse = [
      'hello world',
      'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L'
    ]

    for (const i of parse) {
      const name = `CID.parse(${JSON.stringify(i)})`
      test(name, async () => await testThrowAny(() => CID.parse(i)))
    }

    const decode = [
      Buffer.from('hello world'),
      Buffer.from('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT')
    ]

    for (const i of decode) {
      const name = `CID.decode(Buffer.from(${JSON.stringify(i.toString())}))`
      test(name, async () => await testThrowAny(() => CID.decode(i)))
    }

    const create = [
      ...[...parse, ...decode].map(i => [0, 112, i]),
      ...[...parse, ...decode].map(i => [1, 112, i]),
      [18, 112, 'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L']
    ]

    for (const [version, code, hash] of create) {
      const form = JSON.stringify(hash.toString())
      const mh = Buffer.isBuffer(hash) ? `Buffer.from(${form})` : form
      const name = `CID.create(${version}, ${code}, ${mh})`
      test(name, async () => await testThrowAny(() => CID.create(version, code, hash)))
    }

    test('invalid fixtures', async () => {
      for (const test of invalidMultihash) {
        const buff = fromHex(`0171${test.hex}`)
        assert.throws(() => CID.decode(buff), new RegExp(test.message))
      }
    })
  })

  describe('idempotence', () => {
    const h1 = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'
    const cid1 = CID.parse(h1)
    const cid2 = CID.asCID(cid1)

    test('constructor accept constructed instance', () => {
      same(cid1 === cid2, true)
    })
  })

  describe('conversion v0 <-> v1', () => {
    test('should convert v0 to v1', async () => {
      const hash = await sha256.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = (CID.create(0, 112, hash)).toV1()
      same(cid.version, 1)
    })

    test('should convert v1 to v0', async () => {
      const hash = await sha256.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = (CID.create(1, 112, hash)).toV0()
      same(cid.version, 0)
    })

    test('should not convert v1 to v0 if not dag-pb codec', async () => {
      const hash = await sha256.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = CID.create(1, 0x71, hash)
      await testThrow(() => cid.toV0(), 'Cannot convert a non dag-pb CID to CIDv0')
    })

    test('should not convert v1 to v0 if not sha2-256 multihash', async () => {
      const hash = await sha512.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.toV0(), 'Cannot convert non sha2-256 multihash CID to CIDv0')
    })

    test('should return same instance when converting v1 to v1', async () => {
      const hash = await sha512.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = CID.create(1, 112, hash)

      same(cid.toV1() === cid, true)
    })

    test('should return same instance when converting v0 to v0', async () => {
      const hash = await sha256.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = CID.create(0, 112, hash)
      same(cid.toV0() === cid, true)
    })
  })

  describe('caching', () => {
    test('should cache CID as buffer', async () => {
      const hash = await sha256.digest(Buffer.from(`TEST${Date.now()}`))
      const cid = CID.create(1, 112, hash)
      assert.ok(cid.bytes)
      same(cid.bytes, cid.bytes)
    })

    test('should cache string representation when it matches the multibaseName it was constructed with', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      same(cid._baseCache.size, 0)

      same(cid.toString(base64), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
      same(cid._baseCache.get(base64.prefix), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')

      same(cid._baseCache.has(base32.prefix), false)

      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu'
      same(cid.toString(), base32String)

      same(cid._baseCache.get(base32.prefix), base32String)
      same(cid.toString(base64), 'mAXASILp4Fr+PAc/qQUFA3l2uIiOwA2Gjlhd6nLQQ/2HyABWt')
    })
    test('should cache string representation when constructed with one', () => {
      const base32String = 'bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu'
      const cid = CID.parse(base32String)
      same(cid._baseCache.get(base32.prefix), base32String)
    })
  })

  test('toJSON()', async () => {
    const hash = await sha256.digest(Buffer.from('abc'))
    const cid = CID.create(1, 112, hash)
    const json = cid.toJSON()

    same({ ...json, hash: null }, { code: 112, version: 1, hash: null })
    assert.ok(equals(json.hash, hash.bytes))
  })

  test('isCID', async () => {
    const hash = await sha256.digest(Buffer.from('abc'))
    const cid = CID.create(1, 112, hash)
    assert.strictEqual(OLDCID.isCID(cid), false)
  })

  test('asCID', async () => {
    const hash = await sha256.digest(Buffer.from('abc'))
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

    const incompatibleCID = new IncompatibleCID(version, code, hash)
    assert.ok(CID.isCID(incompatibleCID))
    assert.strictEqual(incompatibleCID.toString(), '[object Object]')
    assert.strictEqual(typeof incompatibleCID.toV0, 'undefined')

    const cid1 = CID.asCID(incompatibleCID)
    assert.ok(cid1 instanceof CID)
    assert.strictEqual(cid1.code, code)
    assert.strictEqual(cid1.version, version)
    assert.ok(equals(cid1.multihash, hash))

    const cid2 = CID.asCID({ version, code, hash })
    assert.strictEqual(cid2, null)

    const duckCID = { version, code, multihash: hash }
    duckCID.asCID = duckCID
    const cid3 = CID.asCID(duckCID)
    assert.ok(cid3 instanceof CID)
    assert.strictEqual(cid3.code, code)
    assert.strictEqual(cid3.version, version)
    assert.ok(equals(cid3.multihash, hash))

    const cid4 = CID.asCID(cid3)
    assert.strictEqual(cid3, cid4)

    const cid5 = CID.asCID(new OLDCID(1, 'raw', Buffer.from(hash.bytes)))
    assert.ok(cid5 instanceof CID)
    assert.strictEqual(cid5.version, 1)
    assert.ok(equals(cid5.multihash, hash))
    assert.strictEqual(cid5.code, 85)
  })

  const digestsame = (x, y) => {
    same(x.digest, y.digest)
    same(x.hash, y.hash)
    same(x.bytes, y.bytes)
    if (x.multihash) {
      digestsame(x.multihash, y.multihash)
    }
    const empty = { hash: null, bytes: null, digest: null, multihash: null }
    same({ ...x, ...empty }, { ...y, ...empty })
  }

  describe('CID.parse', async () => {
    test('parse 32 encoded CIDv1', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)

      const parsed = CID.parse(cid.toString())
      digestsame(cid, parsed)
    })

    test('parse base58btc encoded CIDv1', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)

      const parsed = CID.parse(cid.toString(base58btc))
      digestsame(cid, parsed)
    })

    test('parse base58btc encoded CIDv0', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(0, 112, hash)

      const parsed = CID.parse(cid.toString())
      digestsame(cid, parsed)
    })

    test('fails to parse base64 encoded CIDv1', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      const msg = 'To parse non base32 or base58btc encoded CID multibase decoder must be provided'

      await testThrow(() => CID.parse(cid.toString(base64)), msg)
    })

    test('parses base64 encoded CIDv1 if base64 is provided', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)

      const parsed = CID.parse(cid.toString(base64), base64)
      digestsame(cid, parsed)
    })
  })

  test('inspect bytes', () => {
    const byts = fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    const inspected = CID.inspectBytes(byts.subarray(0, 10)) // should only need the first few bytes
    same({
      version: 1,
      codec: 0x71,
      multihashCode: 0x12,
      multihashSize: 34,
      digestSize: 32,
      size: 36
    }, inspected)

    describe('decodeFirst', () => {
      test('no remainder', () => {
        const byts = fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
        const [cid, remainder] = CID.decodeFirst(byts)
        same(cid.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu')
        same(remainder.byteLength, 0)
      })

      test('remainder', () => {
        const byts = fromHex('01711220ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad0102030405')
        const [cid, remainder] = CID.decodeFirst(byts)
        same(cid.toString(), 'bafyreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu')
        same(toHex(remainder), '0102030405')
      })
    })
  })

  test('new CID from old CID', async () => {
    const hash = await sha256.digest(Buffer.from('abc'))
    const cid = CID.asCID(new OLDCID(1, 'raw', Buffer.from(hash.bytes)))
    same(cid.version, 1)

    assert.ok(equals(cid.multihash, hash))
    same(cid.code, 85)
  })

  if (!process.browser) {
    test('util.inspect', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      same(util.inspect(cid), 'CID(bafybeif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu)')
    })
  }

  describe('deprecations', async () => {
    test('codec', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.codec, '"codec" property is deprecated, use integer "code" property instead')
      await testThrow(() => CID.create(1, 'dag-pb', hash), 'String codecs are no longer supported')
    })
    test('multibaseName', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.multibaseName, '"multibaseName" property is deprecated')
    })
    test('prefix', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.prefix, '"prefix" property is deprecated')
    })
    test('toBaseEncodedString()', async () => {
      const hash = await sha256.digest(Buffer.from('abc'))
      const cid = CID.create(1, 112, hash)
      await testThrow(() => cid.toBaseEncodedString(), 'Deprecated, use .toString()')
    })
  })

  test('invalid CID version', async () => {
    const encoded = varint.encodeTo(2, new Uint8Array(32))
    await testThrow(() => CID.decode(encoded), 'Invalid CID version 2')
  })

  test('buffer', async () => {
    const hash = await sha256.digest(Buffer.from('abc'))
    const cid = CID.create(1, 112, hash)
    await testThrow(() => cid.buffer, 'Deprecated .buffer property, use .bytes to get Uint8Array instead')
  })
})
