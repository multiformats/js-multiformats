import { coerce } from '../bytes.js'
import basex from '../vendor/base-x.js'
import type { BaseCodec, BaseDecoder, BaseEncoder, CombobaseDecoder, Multibase, MultibaseCodec, MultibaseDecoder, MultibaseEncoder, UnibaseDecoder } from './interface.js'

interface EncodeFn { (bytes: Uint8Array): string }
interface DecodeFn { (text: string): Uint8Array }

/**
 * Class represents both BaseEncoder and MultibaseEncoder meaning it
 * can be used to encode to multibase or base encode without multibase
 * prefix.
 */
class Encoder<Base extends string, Prefix extends string> implements MultibaseEncoder<Prefix>, BaseEncoder {
  readonly name: Base
  readonly prefix: Prefix
  readonly baseEncode: EncodeFn

  constructor (name: Base, prefix: Prefix, baseEncode: EncodeFn) {
    this.name = name
    this.prefix = prefix
    this.baseEncode = baseEncode
  }

  encode (bytes: Uint8Array): Multibase<Prefix> {
    if (bytes instanceof Uint8Array) {
      return `${this.prefix}${this.baseEncode(bytes)}`
    } else {
      throw Error('Unknown type, must be binary type')
    }
  }
}

/**
 * Class represents both BaseDecoder and MultibaseDecoder so it could be used
 * to decode multibases (with matching prefix) or just base decode strings
 * with corresponding base encoding.
 */
class Decoder<Base extends string, Prefix extends string> implements MultibaseDecoder<Prefix>, UnibaseDecoder<Prefix>, BaseDecoder {
  readonly name: Base
  readonly prefix: Prefix
  readonly baseDecode: DecodeFn
  private readonly prefixCodePoint: number

  constructor (name: Base, prefix: Prefix, baseDecode: DecodeFn) {
    this.name = name
    this.prefix = prefix
    const prefixCodePoint = prefix.codePointAt(0)
    /* c8 ignore next 3 */
    if (prefixCodePoint === undefined) {
      throw new Error('Invalid prefix character')
    }
    this.prefixCodePoint = prefixCodePoint
    this.baseDecode = baseDecode
  }

  decode (text: string): Uint8Array {
    if (typeof text === 'string') {
      if (text.codePointAt(0) !== this.prefixCodePoint) {
        throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`)
      }
      return this.baseDecode(text.slice(this.prefix.length))
    } else {
      throw Error('Can only multibase decode strings')
    }
  }

  or<OtherPrefix extends string> (decoder: UnibaseDecoder<OtherPrefix> | ComposedDecoder<OtherPrefix>): ComposedDecoder<Prefix | OtherPrefix> {
    return or(this, decoder)
  }
}

type Decoders<Prefix extends string> = Record<Prefix, UnibaseDecoder<Prefix>>

class ComposedDecoder<Prefix extends string> implements MultibaseDecoder<Prefix>, CombobaseDecoder<Prefix> {
  readonly decoders: Decoders<Prefix>

  constructor (decoders: Decoders<Prefix>) {
    this.decoders = decoders
  }

  or <OtherPrefix extends string> (decoder: UnibaseDecoder<OtherPrefix> | ComposedDecoder<OtherPrefix>): ComposedDecoder<Prefix | OtherPrefix> {
    return or(this, decoder)
  }

  decode (input: string): Uint8Array {
    const prefix = input[0] as Prefix
    const decoder = this.decoders[prefix]
    if (decoder != null) {
      return decoder.decode(input)
    } else {
      throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`)
    }
  }
}

export function or <L extends string, R extends string> (left: UnibaseDecoder<L> | CombobaseDecoder<L>, right: UnibaseDecoder<R> | CombobaseDecoder<R>): ComposedDecoder<L | R> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return new ComposedDecoder({
    ...(left.decoders ?? { [(left as UnibaseDecoder<L>).prefix]: left }),
    ...(right.decoders ?? { [(right as UnibaseDecoder<R>).prefix]: right })
  } as Decoders<L | R>)
}

export class Codec<Base extends string, Prefix extends string> implements MultibaseCodec<Prefix>, MultibaseEncoder<Prefix>, MultibaseDecoder<Prefix>, BaseCodec, BaseEncoder, BaseDecoder {
  readonly name: Base
  readonly prefix: Prefix
  readonly baseEncode: EncodeFn
  readonly baseDecode: DecodeFn
  readonly encoder: Encoder<Base, Prefix>
  readonly decoder: Decoder<Base, Prefix>

  constructor (name: Base, prefix: Prefix, baseEncode: EncodeFn, baseDecode: DecodeFn) {
    this.name = name
    this.prefix = prefix
    this.baseEncode = baseEncode
    this.baseDecode = baseDecode
    this.encoder = new Encoder(name, prefix, baseEncode)
    this.decoder = new Decoder(name, prefix, baseDecode)
  }

  encode (input: Uint8Array): string {
    return this.encoder.encode(input)
  }

  decode (input: string): Uint8Array {
    return this.decoder.decode(input)
  }
}

export function from <Base extends string, Prefix extends string> ({ name, prefix, encode, decode }: { name: Base, prefix: Prefix, encode: EncodeFn, decode: DecodeFn }): Codec<Base, Prefix> {
  return new Codec(name, prefix, encode, decode)
}

export function baseX <Base extends string, Prefix extends string> ({ name, prefix, alphabet }: { name: Base, prefix: Prefix, alphabet: string }): Codec<Base, Prefix> {
  const { encode, decode } = basex(alphabet, name)
  return from({
    prefix,
    name,
    encode,
    decode: (text: string): Uint8Array => coerce(decode(text))
  })
}

function decode (string: string, alphabet: string, bitsPerChar: number, name: string): Uint8Array {
  // Build the character lookup table:
  const codes: Record<string, number> = {}
  for (let i = 0; i < alphabet.length; ++i) {
    codes[alphabet[i]] = i
  }

  // Count the padding bytes:
  let end = string.length
  while (string[end - 1] === '=') {
    --end
  }

  // Allocate the output:
  const out = new Uint8Array((end * bitsPerChar / 8) | 0)

  // Parse the data:
  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  let written = 0 // Next byte to write
  for (let i = 0; i < end; ++i) {
    // Read one character from the string:
    const value = codes[string[i]]
    if (value === undefined) {
      throw new SyntaxError(`Non-${name} character`)
    }

    // Append the bits to the buffer:
    buffer = (buffer << bitsPerChar) | value
    bits += bitsPerChar

    // Write out some bits if the buffer has a byte's worth:
    if (bits >= 8) {
      bits -= 8
      out[written++] = 0xff & (buffer >> bits)
    }
  }

  // Verify that we have received just enough bits:
  if (bits >= bitsPerChar || (0xff & (buffer << (8 - bits))) !== 0) {
    throw new SyntaxError('Unexpected end of data')
  }

  return out
}

function encode (data: Uint8Array, alphabet: string, bitsPerChar: number): string {
  const pad = alphabet[alphabet.length - 1] === '='
  const mask = (1 << bitsPerChar) - 1
  let out = ''

  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  for (let i = 0; i < data.length; ++i) {
    // Slurp data into the buffer:
    buffer = (buffer << 8) | data[i]
    bits += 8

    // Write out as much as we can:
    while (bits > bitsPerChar) {
      bits -= bitsPerChar
      out += alphabet[mask & (buffer >> bits)]
    }
  }

  // Partial character:
  if (bits !== 0) {
    out += alphabet[mask & (buffer << (bitsPerChar - bits))]
  }

  // Add padding characters until we hit a byte boundary:
  if (pad) {
    while (((out.length * bitsPerChar) & 7) !== 0) {
      out += '='
    }
  }

  return out
}

/**
 * RFC4648 Factory
 */
export function rfc4648 <Base extends string, Prefix extends string> ({ name, prefix, bitsPerChar, alphabet }: { name: Base, prefix: Prefix, bitsPerChar: number, alphabet: string }): Codec<Base, Prefix> {
  return from({
    prefix,
    name,
    encode (input: Uint8Array): string {
      return encode(input, alphabet, bitsPerChar)
    },
    decode (input: string): Uint8Array {
      return decode(input, alphabet, bitsPerChar, name)
    }
  })
}
