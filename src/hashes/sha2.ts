import crypto from 'node:crypto'
import { coerce } from '../bytes.ts'
import { from } from './hasher.ts'

export const sha256 = from({
  name: 'sha2-256',
  code: 0x12,
  encode: (input) => coerce(crypto.createHash('sha256').update(input).digest())
})

export const sha512 = from({
  name: 'sha2-512',
  code: 0x13,
  encode: input => coerce(crypto.createHash('sha512').update(input).digest())
})
