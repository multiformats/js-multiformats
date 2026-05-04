import crypto from 'crypto'
import { coerce } from '../bytes.ts'
import { from } from './hasher.ts'

export const sha1 = from({
  name: 'sha-1',
  code: 0x11,
  encode: (input) => coerce(crypto.createHash('sha1').update(input).digest())
})
