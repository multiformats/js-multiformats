/**
 * IPLD encoder part of the codec.
 */
export interface BlockEncoder<T> {
  name: string
  code: number
  encode(data: T): Uint8Array
}

/**
 * IPLD decoder part of the codec.
 */
export interface BlockDecoder<T> {
  code: number
  decode(bytes: Uint8Array): T
}

/**
 * IPLD codec that is just Encoder + Decoder however it is
 * separate those capabilties as sender requires encoder and receiver
 * requires decoder.
 */
export interface BlockCodec<T> extends BlockEncoder<T>, BlockDecoder<T> { }

