// Block
import CID from '../cid'
import { MultihashHasher } from '../hashes/interface'
import { ByteView, Encoder, Decoder, Codec } from '../codecs/interface'

// Just a representation for awaitable `T`.
export type Awaitable<T> =
  | T
  | Promise<T>

export interface Config {
  hasher: MultihashHasher<number>
}

export interface Block<T> {
  cid(): Awaitable<CID>

  /**
   * Returns data corresponding to this block.
   */
  toData(): T

  /**
   * Returns binary representation of this block.
   */
  toBytes(): ByteView<T>
}


export type BlockView<Codec extends number, Algorithm extends number, T> =
  // In most cases CID for the encoded blocks is known, Which is why it
  // is represented as pair of cid and bytes.
  | { cid: CID, bytes: ByteView<T> }
  // In case where CID is unknown it still can be represented using `code`
  // and `bytes`.
  | { cid?: undefined, code: Codec, alogrithm?: Algorithm, bytes: ByteView<T> }

/**
 * Represents a block draft to to be endoded. It has `code` 
 */
export type BlockDraft<Codec extends number, Algorithm extends number, T> = {
  /**
   * Block data in raw form.
   */
  value: T
  /**
   * IPLD codec code to be used for encoding this block.
   */
  code: Codec,
  /**
   * Optional hasher to be used for the CID creation for this block. If not
   * provided dag encoder will use the default one.
   */
  alogrithm: Algorithm
}


/**
 * Simple DAG encoder allows encoding blocks into various encodings (all the
 * encodings that it's codec supports) and hashes their content with a same
 * hashing algorithm (it's bound to), unless `BlockDraft` also includes a
 * hasher
 */
export interface DagEncoder<Codec extends number, Algorithm extends number, T> {
  codec: Encoder<Codec, T>
  hasher: MultihashHasher<Algorithm>

  encode(block: BlockDraft<Codec, Algorithm, T>): Block<T>
}


export interface DagDecoder<Codec extends number, Algorithm extends number, T> {
  codec: Decoder<Codec, T>
  hasher: MultihashHasher<Algorithm>

  decode(block: BlockView<Codec, Algorithm, T>): Block<T>
}

export interface DagCodec<Code extends number, Algorithm extends number, T> extends DagEncoder<Code, Algorithm, T>, DagDecoder<Code, Algorithm, T> {
  codec: Codec<Code, T>

  decoder: DagDecoder<Code, Algorithm, T>
  encoder: DagEncoder<Code, Algorithm, T>

}

export { ByteView }
