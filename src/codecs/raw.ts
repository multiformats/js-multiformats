import { coerce } from '../bytes.js'
import type { ByteView } from './interface.js'

export const name = 'raw'
export const code = 0x55

export const encode = (node: Uint8Array): ByteView<Uint8Array> => coerce(node)

export const decode = (data: ByteView<Uint8Array>): Uint8Array => coerce(data)
