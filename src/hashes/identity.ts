import { coerce } from '../bytes.js'
import * as Digest from './digest.js'

const code = 0x0
const name = 'identity'

const encode: (input: Uint8Array) => Uint8Array = coerce

const digest = (input: Uint8Array): Digest.Digest<typeof code, number> => Digest.create(code, encode(input))

export const identity = { code, name, encode, digest }
