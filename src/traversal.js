import { base58btc } from './bases/base58.js'

/**
 * @template [C=number] - multicodec code corresponding to codec used to encode the block
 * @template [A=number] - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template [V=0|1] - CID version
 * @typedef {import('./cid').CID<unknown, C, A, V>} CID
 */

/**
 * @template [T=unknown] - Logical type of the data encoded in the block
 * @template [C=number] - multicodec code corresponding to codec used to encode the block
 * @template [A=number] - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template [V=0|1] - CID version
 * @typedef {import('./block/interface.js').BlockView<T, C, A, V>} BlockView
 */

/**
 * @param {object} options
 * @param {CID} options.cid
 * @param {(cid: CID) => Promise<BlockView|null>} options.load
 * @param {Set<string>} [options.seen]
 */
const walk = async ({ cid, load, seen }) => {
  seen = seen || new Set()
  const b58Cid = cid.toString(base58btc)
  if (seen.has(b58Cid)) {
    return
  }

  const block = await load(cid)
  seen.add(b58Cid)

  if (block === null) { // the loader signals with `null` that we should skip this block
    return
  }

  for (const [, cid] of block.links()) {
    await walk({ cid, load, seen })
  }
}

export { walk }
