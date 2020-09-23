// IPLD Codec

/**
 * IPLD encoder part of the codec.
 */
export interface BlockEncoder<Code extends number, T> {
  /**
   * Name of the multicodec.
   * @see https://github.com/multiformats/multicodec/blob/master/table.csv
   */
  readonly name: string

  /**
   * Code of the multicodec
   * @see https://github.com/multiformats/multicodec/blob/master/table.csv
   */
  readonly code: Code

  /**
   * Takes JS value and serializes it to bytes.
   */
  encodeBlock(value: T): ByteView<T>
}

/**
 * IPLD encoder part of the codec.
 */
export interface BlockDecoder<Code extends number, T> {
  /**
   * Code of the multicodec
   * @see https://github.com/multiformats/multicodec/blob/master/table.csv
   */
  readonly code: Code

  /**
   * Takes binary encoded JS value and turns it into an actual value.
   */
  decodeBlock(bytes: ByteView<T>): T
}


/**
 * IPLD codec that is just Encoder + Decoder. To separate those capabilities
 * (since sender requires encoder and receiver requires decoder).
 */
export interface BlockCodec<Code extends number, T> extends BlockEncoder<Code, T>, BlockDecoder<Code, T> {
  /**
   * Encoder part of the codec.
   */
  readonly encoder: BlockEncoder<Code, T>
  /**
   * Decoder part of the codec.
   */
  readonly decoder: BlockDecoder<Code, T>
}

// Multicodecs


/**
 * Composition of one or more `BlockEncoder`s so it can be used to encode JS
 * values into multiple formats by disptaching to a corresponding `BlockEncoder`.
 */
export interface Encoder<Code extends number, T> {
  /**
   * Table of block encoders keyed by code.
   */
  readonly codecs: Record<Code, BlockEncoder<Code, T>>

  /**
   * Encodes `{code, value}` input into `{code, bytes}`. If input `code` is not
   * supported throws an exception.
   */
  encode(input: BlockSource<Code, T>): BlockView<Code, T>
}

/**
 * Composition of one or more `BlockDecoder`s so it can be used to decode JS
 * values from multiple formats by disptaching to a corresponding `BlockDecoder`.
 */
export interface Decoder<Code extends number, T> {
  readonly codecs: Record<Code, BlockDecoder<Code, T>>

  /**
   * Decodes `{code, bytes}` to `{code, value}`. If input `code` is not
   * supported throws an exception.
   */
  decode(view: BlockView<Code, T>): BlockSource<Code, T>
}

export interface Codec<Code extends number, T> extends Encoder<Code, T>, Decoder<Code, T> {
  readonly codecs: Record<Code, BlockCodec<Code, T>>

  /**
   * Encoder part of the codec.
   */
  readonly encoder: Encoder<Code, T>
  /**
   * Decoder part of the codec.
   */
  readonly decoder: Decoder<Code, T>
}


export interface BlockSource<Code extends number, T> {
  /**
   * Multiformat code of the encoding.
   */
  code: Code
  /**
   * JS value.
   */
  value: T
}

export interface BlockView<Code extends number, T> {
  /**
   * Multiformat code of the encoding.
   */
  code: Code

  /**
   * Binary encoded JS value.
   */
  bytes: ByteView<T>
}


// This just a hack to retain type information abouth the data that
// is incoded `T`  Because it's a union `data` field is never going
// to be usable anyway.
export type ByteView<T> =
  | Uint8Array
  | Uint8Array & { data: T }
