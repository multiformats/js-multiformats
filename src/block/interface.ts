// Block
import { MultibaseCodec } from "../bases/interface"
import { BlockEncoder as Encoder, BlockDecoder as Decoder } from "../codecs/interface"
import { MultihashHasher as Hasher } from "../hashes/interface"
import { CID } from "../cid"


// Just a representation for awaitable `T`.
export type Awaitable<T> =
  | T
  | Promise<T>


export interface Block {
  cid(): Awaitable<CID>
  encode(): Awaitable<Uint8Array>
}


export interface Config {
  /**
   * Multihasher to be use for the CID of the block. Will use a default
   * if not provided.
   */
  hasher: Hasher
  /**
   * Base encoder that will be passed by the CID of the block.
   */
  base: MultibaseCodec<any>

  /**
   * Base codec that will be used with CIDv0.
   */
  base58btc: MultibaseCodec<'z'>
}




