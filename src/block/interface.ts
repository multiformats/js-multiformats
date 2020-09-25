// Block
import CID from "../cid"
import { MultihashHasher } from '../hashes/interface'

// Just a representation for awaitable `T`.
export type Awaitable<T> =
  | T
  | Promise<T>


export interface Block {
  cid(): Awaitable<CID>
  encode(): Awaitable<Uint8Array>
}

export interface Config {
  hasher: MultihashHasher
}
