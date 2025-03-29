import { from } from './base.js'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

function indexOf (char: string): number {
  const index = alphabet.indexOf(char)
  if (index === -1) {
    throw new Error(`Non-base45 character: ${char}`)
  }
  return index
}

export const base45 = from({
  name: 'base45',
  prefix: 'R',
  encode: (input: Uint8Array): string => {
    let ret = ''
    for (let i = 0; i < input.length; i += 2) {
      if (i + 1 === input.length) {
        const v = input[i]
        const a = v / 45 | 0
        const b = v % 45 | 0
        ret += alphabet[b] + alphabet[a]
        break
      }
      const v = input[i] << 8 | input[i + 1]
      const a = v / 45 ** 2 | 0
      const b = v / 45 % 45 | 0
      const c = v % 45
      ret += alphabet[c] + alphabet[b] + alphabet[a]
    }
    return ret
  },
  decode: (input: string): Uint8Array => {
    if ((input.length * 2) % 3 === 2) {
      throw new Error('Unexpected end of data')
    }
    const out = new Uint8Array(Math.floor(input.length * 2 / 3))
    for (let i = 0; i < input.length; i += 3) {
      if (i + 2 === input.length) {
        const v = indexOf(input[i]) + indexOf(input[i + 1]) * 45
        out[i / 3 * 2] = v
        break
      }
      const v = indexOf(input[i]) + indexOf(input[i + 1]) * 45 + indexOf(input[i + 2]) * 45 ** 2
      out[i / 3 * 2] = v >> 8
      out[i / 3 * 2 + 1] = v & 0xff
    }
    return out
  }
})
