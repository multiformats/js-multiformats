/**
 * IPLD encoder part of the codec.
 */
export interface BlockEncoder<Code extends number, T> {
  name: string
  code: Code
  encode(data: T): ByteView<T>
}

/**
 * IPLD decoder part of the codec.
 */
export interface BlockDecoder<Code extends number, T> {
  code: Code
  decode(bytes: ByteView<T>): T
}

/**
 * IPLD codec that is just Encoder + Decoder however it is
 * separate those capabilties as sender requires encoder and receiver
 * requires decoder.
 */
export interface BlockCodec<Code extends number, T> extends BlockEncoder<Code, T>, BlockDecoder<Code, T> {
  encoder: BlockEncoder<Code, T>,
  decoder: BlockDecoder<Code, T>
}


// This just a hack to retain type information abouth the data that
// is incoded `T`  Because it's a union `data` field is never going
// to be usable anyway.
export type ByteView<T> =
  | Uint8Array
  | Uint8Array & { data: T }
