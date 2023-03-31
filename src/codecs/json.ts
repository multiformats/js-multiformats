import type { ByteView } from './interface.js'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const name = 'json'
export const code = 0x0200

export const encode = <T>(node: T): ByteView<T> => textEncoder.encode(JSON.stringify(node))

export const decode = <T>(data: ByteView<T>): T => JSON.parse(textDecoder.decode(data))
