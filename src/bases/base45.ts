import { from } from './base.ts'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const INVALID = 0xff
const decodeTable = (() => {
  const table = new Uint8Array(256).fill(INVALID)
  for (let i = 0; i < alphabet.length; i++) {
    table[alphabet.charCodeAt(i)] = i
  }
  return table
})()

function decodeChar (input: string, i: number): number {
  const v = decodeTable[input.charCodeAt(i)]
  if (v === INVALID) {
    throw new Error(`Non-base45 character: ${input[i]}`)
  }
  return v
}

export const base45 = from({
  name: 'base45',
  prefix: 'R',
  encode: (input: Uint8Array): string => {
    let ret = ''
    for (let i = 0; i < input.length; i += 2) {
      if (i + 1 === input.length) {
        const v = input[i]
        ret += alphabet[v % 45] + alphabet[(v / 45) | 0]
        break
      }
      const v = (input[i] << 8) | input[i + 1]
      ret += alphabet[v % 45] + alphabet[((v / 45) | 0) % 45] + alphabet[(v / 2025) | 0]
    }
    return ret
  },
  decode: (input: string): Uint8Array<ArrayBuffer> => {
    if ((input.length * 2) % 3 === 2) {
      throw new Error('Unexpected end of data')
    }
    const out = new Uint8Array(((input.length * 2) / 3) | 0)
    let o = 0
    for (let i = 0; i < input.length; i += 3) {
      if (i + 2 === input.length) {
        const v = decodeChar(input, i) + decodeChar(input, i + 1) * 45
        if (v > 0xff) {
          throw new Error('Invalid base45 encoding: trailing chunk out of range')
        }
        out[o++] = v
        break
      }
      const v = decodeChar(input, i) + decodeChar(input, i + 1) * 45 + decodeChar(input, i + 2) * 2025
      if (v > 0xffff) {
        throw new Error('Invalid base45 encoding: chunk out of range')
      }
      out[o++] = v >> 8
      out[o++] = v & 0xff
    }
    return out
  }
})
