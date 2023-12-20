import { base58btc } from './bases/base58.js'
import type { BlockView as _BlockView } from './block/interface.js'
import type { CID, Version } from './cid.js'

type BlockView<T=unknown, C extends number = number, A extends number = number, V extends Version = Version> = _BlockView<T, C, A, V>

export async function walk ({ cid, load, seen }: { cid: CID, load(cid: CID): Promise<BlockView | null>, seen?: Set<string> }): Promise<void> {
  seen = seen ?? new Set()
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
