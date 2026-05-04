import { fromString, toString } from '../bytes.ts'
import { from } from './base.ts'

export const identity = from({
  prefix: '\x00',
  name: 'identity',
  encode: (buf) => toString(buf),
  decode: (str) => fromString(str)
})
