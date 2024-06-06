import { from } from './base.js'

const consonants = 'bdfghjklmnprstvz'
const vowels = 'aiou'

function consonantIndex (c: string): number {
  const idx = consonants.indexOf(c)
  if (idx === -1) {
    throw new Error(`Non-proquint character: ${c}`)
  }
  return idx
}

function vowelIndex (v: string): number {
  const idx = vowels.indexOf(v)
  if (idx === -1) {
    throw new Error(`Non-proquint character: ${v}`)
  }
  return idx
}

export const proquint = from({
  name: 'proquint',
  prefix: 'p',
  encode: (input: Uint8Array): string => {
    // blocks of 16 bits in the pattern:
    // 4 bits = consonant
    // 2 bits = vowel
    // 4 bits = consonant
    // 2 bits = vowel
    // 4 bits = consonant
    // '-'
    let ret = 'ro-'
    for (let i = 0; i < input.length; i += 2) {
      let y = input[i] << 8
      if (i + 1 !== input.length) {
        y |= input[i + 1]
      }
      ret += consonants[y >> 12 & 0xf]
      ret += vowels[(y >> 10) & 0x03]
      ret += consonants[(y >> 6) & 0x0f]
      if (i + 1 !== input.length) {
        ret += vowels[(y >> 4) & 0x03]
        ret += consonants[y & 0x0f]
      }
      if (i + 2 < input.length) {
        ret += '-'
      }
    }

    return ret
  },
  decode: (input: string): Uint8Array => {
    if (!input.startsWith('ro-')) {
      throw new Error('Invalid proquint string')
    }
    input = input.slice(3)
    const out = []
    let i = 0
    while (i < input.length) {
      const hasFive = input.length - i >= 5
      // must have at least 3
      if (!hasFive && input.length - i < 3) {
        throw new Error('Unexpected end of data')
      }
      let y = consonantIndex(input[i++]) << 12
      y |= vowelIndex(input[i++]) << 10
      y |= consonantIndex(input[i++]) << 6
      if (hasFive) {
        y |= vowelIndex(input[i++]) << 4
        y |= consonantIndex(input[i++])
      }
      out.push(y >> 8)
      if (hasFive) {
        out.push(y & 0xff)
        if (input[i] === '-') {
          if (i + 1 === input.length) {
            throw new Error('Unexpected end of data')
          }
          i++
        }
      }
    }

    return Uint8Array.from(out)
  }
})
