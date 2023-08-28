import { base58btc } from './bases/base58.js'

/**
 * @typedef {import('./cid').CID} CID
 */

/**
 * @typedef {import('./block/interface.js').BlockView} BlockView
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
