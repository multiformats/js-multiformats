import type { ArrayBufferView, ByteView } from '../block/interface.js'

/**
 * IPLD encoder part of the codec.
 */
export interface BlockEncoder<Code extends number, Universe> {
  name: string
  code: Code
  encode<T extends Universe>(data: T): ByteView<T>
}

/**
 * IPLD decoder part of the codec.
 */
export interface BlockDecoder<Code extends number, Universe> {
  code: Code
  decode<T extends Universe>(bytes: ByteView<T> | ArrayBufferView<T>): T
}

/**
 * An IPLD codec is a combination of both encoder and decoder.
 */
export interface BlockCodec<Code extends number, Universe> extends BlockEncoder<Code, Universe>, BlockDecoder<Code, Universe> {}

export type { ArrayBufferView, ByteView }
