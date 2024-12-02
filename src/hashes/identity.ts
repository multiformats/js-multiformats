import { coerce } from '../bytes.js'
import { from } from './hasher.js'

const code: 0x0 = 0x0
const name = 'identity'

const encode: (input: Uint8Array) => Uint8Array = coerce

export const identity = from({
  name,
  code,
  encode
})
