import { base58btc } from './bases/base58.js'
// Linter can see that API is used in types.
// eslint-disable-next-line
import * as API from './link/interface.js'

/**
 * @template {number} [C=number] - multicodec code corresponding to codec used to encode the block
 * @template {number} [A=number] - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} [V=API.Version] - CID version
 * @typedef {import('./cid/interface.js').CID<unknown, C, A, V>} CID
 */

/**
 * @template {unknown} [T=unknown] - Logical type of the data encoded in the block
 * @template {number} [C=number] - multicodec code corresponding to codec used to encode the block
 * @template {number} [A=number] - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} [V=API.Version] - CID version
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
  const b58Cid = base58btc.encode(cid.bytes)
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
