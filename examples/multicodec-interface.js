// Example of multicodec implementation for JSON (UTF-8-encoded)
// Codec implementations should conform to the BlockCodec interface which implements both BlockEncoder and BlockDecoder

/**
 * @template T
 * @type {BlockCodec<0x0200, T>}
 */
export const { name, code, encode, decode } = {
  name: 'json',
  code: 0x0200,
  encode: json => new TextEncoder().encode(JSON.stringify(json)),
  decode: bytes => JSON.parse(new TextDecoder().decode(bytes))
}
