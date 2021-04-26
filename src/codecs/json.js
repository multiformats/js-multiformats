// @ts-check

/**
 * @template {number} Code
 * @template T
 * @typedef {import('./interface').BlockCodec<Code, T>} BlockCodec
 */

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
