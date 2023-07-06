import type { ByteView } from './interface.js'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const name = 'json'
export const code = 0x0200

export function encode <T> (node: T): ByteView<T> {
  return textEncoder.encode(JSON.stringify(node))
}

export function decode <T> (data: ByteView<T>): T {
  return JSON.parse(textDecoder.decode(data))
}
