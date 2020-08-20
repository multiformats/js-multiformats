import { MultibaseCodec, BaseCodec } from "../bases/interface.js"


export interface Config {
  /**
   * Multibase codec used by CID to encode / decode to and out of
   * string representation.
   */
  base: MultibaseCodec<any>
  /**
   * CIDv0 requires base58btc encoding decoding so CID must be
   * provided means to perform that task.
   */
  base58btc: MultibaseCodec<'z'>
}