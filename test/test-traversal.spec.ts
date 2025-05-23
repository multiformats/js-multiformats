/* globals describe, it */

import { assert } from 'aegir/chai'
import * as main from '../src/block.js'
import { fromString } from '../src/bytes.js'
import * as codec from '../src/codecs/json.js'
import { sha256 as hasher } from '../src/hashes/sha2.js'
import { walk } from '../src/traversal.js'
import type { BlockView } from '../src/block/interface.js'
import type { CID } from '../src/cid.js'

// from dag-pb, simplified
function createNode (data: Uint8Array, links: Array<{ Hash: CID, Name: string, Tsize: number }>): { Data: Uint8Array, Links: Array<{ Hash: CID, Name: string, Tsize: number }> } {
  return { Data: data, Links: links }
}

function createLink (name: string, size: number, cid: CID): { Hash: CID, Name: string, Tsize: number } {
  return { Hash: cid, Name: name, Tsize: size }
}

describe('traversal', () => {
  describe('walk', async () => {
    // Forming the following DAG for testing
    //             A
    //           /   \
    //          B     C
    //         / \   / \
    //        D   D D   E
    const linksE = [] as []
    const valueE = createNode(fromString('string E qacdswa'), linksE)
    const blockE = await main.encode({ value: valueE, codec, hasher })
    const cidE = blockE.cid

    const linksD = [] as []
    const valueD = createNode(fromString('string D zasa'), linksD)
    const blockD = await main.encode({ value: valueD, codec, hasher })
    const cidD = blockD.cid

    const linksC = [createLink('link1', 100, cidD), createLink('link2', 100, cidE)]
    const valueC = createNode(fromString('string C zxc'), linksC)
    const blockC = await main.encode({ value: valueC, codec, hasher })
    const cidC = blockC.cid

    const linksB = [createLink('link1', 100, cidD), createLink('link2', 100, cidD)]
    const valueB = createNode(fromString('string B lpokjiasd'), linksB)
    const blockB = await main.encode({ value: valueB, codec, hasher })
    const cidB = blockB.cid

    const linksA = [createLink('link1', 100, cidB), createLink('link2', 100, cidC)]
    const valueA = createNode(fromString('string A qwertcfdgshaa'), linksA)
    const blockA = await main.encode({ value: valueA, codec, hasher })
    const cidA = blockA.cid

    const load = async (cid: CID): Promise<BlockView<unknown, 512, 18, 1> | null> => {
      if (cid.equals(cidE)) {
        return blockE
      }
      if (cid.equals(cidD)) {
        return blockD
      }
      if (cid.equals(cidC)) {
        return blockC
      }
      if (cid.equals(cidB)) {
        return blockB
      }
      if (cid.equals(cidA)) {
        return blockA
      }
      return null
    }

    type loadFn = typeof load

    const loadWrapper = (load: loadFn, arr: string[] = []) =>
      async (cid: CID): Promise<BlockView<unknown, 512, 18, 1> | null> => {
        arr.push(cid.toString())
        return load(cid)
      }

    it('block with no links', async () => {
      // Test Case 1
      // Input DAG
      //            D
      //
      // Expect load to be called with D
      const expectedCallArray = [cidD.toString()]
      const callArray: string[] = []

      await walk({ cid: cidD, load: loadWrapper(load, callArray) })

      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index])
      })
    })

    it('block with links', async () => {
      // Test Case 2
      // Input
      //            C
      //           / \
      //          D   E
      //
      // Expect load to be called with C, then D, then E
      const expectedCallArray = [cidC.toString(), cidD.toString(), cidE.toString()]
      const callArray: string[] = []

      await walk({ cid: cidC, load: loadWrapper(load, callArray) })

      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index])
      })
    })

    it('block with matching links', async () => {
      // Test Case 3
      // Input
      //            B
      //           / \
      //          D   D
      //
      // Expect load to be called with B, then D
      const expectedCallArray = [cidB.toString(), cidD.toString()]
      const callArray: string[] = []

      await walk({ cid: cidB, load: loadWrapper(load, callArray) })

      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index])
      })
    })

    it('depth first with duplicated block', async () => {
      // Test Case 4
      // Input
      //             A
      //           /   \
      //          B     C
      //         / \   / \
      //        D   D D   E
      //
      // Expect load to be called with A, then B, then D, then C, then E
      const expectedCallArray = [
        cidA.toString(),
        cidB.toString(),
        cidD.toString(),
        cidC.toString(),
        cidE.toString()
      ]
      const callArray: string[] = []

      await walk({ cid: cidA, load: loadWrapper(load, callArray) })

      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index])
      })
    })

    it('null return', async () => {
      const links = [] as []
      const value = createNode(fromString('test'), links)
      const block = await main.encode({ value, codec, hasher })
      const cid = block.cid
      const expectedCallArray = [cid.toString()]
      const callArray: string[] = []

      await walk({ cid, load: loadWrapper(load, callArray) })

      expectedCallArray.forEach((value, index) => {
        assert.deepStrictEqual(value, callArray[index])
      })
    })
  })
})
