import { coerce } from '../bytes.js'
import type { ArrayBufferView, ByteView } from './interface.js'

export const name = 'raw'
export const code = 0x55

export function encode (node: Uint8Array): ByteView<Uint8Array> {
  return coerce(node)
}

export function decode (data: ByteView<Uint8Array> | ArrayBufferView<Uint8Array>): Uint8Array {
  return coerce(data)
}
