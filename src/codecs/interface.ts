/**
 * IPLD encoder part of the codec.
 */
export interface BlockEncoder<Code extends number, T> {
  // Reserve the field so that it could be used to diffentitate between
  // multiblock encoder and block encoder.
  codecs?: null

  name: string
  code: Code
  encode(data: T): ByteView<T>

}

/**
 * IPLD decoder part of the codec.
 */
export interface BlockDecoder<Code extends number, T> {
  // Reserve the field so that it could be used to diffentitate between
  // multiblock decoder and block decoder.
  codecs?: null

  code: Code
  decode(bytes: ByteView<T>): T
}

/**
 * IPLD codec that is just Encoder + Decoder however it is
 * separate those capabilties as sender requires encoder and receiver
 * requires decoder.
 */
export interface BlockCodec<Code extends number, T> extends BlockEncoder<Code, T>, BlockDecoder<Code, T> { }


// This just a hack to retain type information abouth the data that
// is incoded `T`  Because it's a union `data` field is never going
// to be usable anyway.
export type ByteView<T> =
  | Uint8Array
  | Uint8Array & { data: T }

export interface MultiblockEncoder<Code extends number, T> {
  codecs: Record<Code, BlockEncoder<Code, T>>

  encode(block: Multiblock<Code, T>): MultiblockView<Code, T>
}

export interface MultiblockDecoder<Code extends number, T> {
  codecs: Record<Code, BlockDecoder<Code, T>>

  decode(view: MultiblockView<Code, T>): Multiblock<Code, T>
}

export interface MultiblockCodec<Code extends number, T> {
  codecs: Record<Code, BlockCodec<Code, T>>

  encode(block: Multiblock<Code, T>): MultiblockView<Code, T>
  decode(view: MultiblockView<Code, T>): Multiblock<Code, T>
}

export interface Multiblock<Code extends number, T> {
  code: Code
  data: T
}

export interface MultiblockView<Code extends number, T> {
  code: Code
  block: ByteView<T>
}
