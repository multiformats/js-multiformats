// @ts-check

import crypto from 'crypto'
import { coerce } from '../bytes.js'
import { from } from './hasher.js'

export const sha1 = from({
  name: 'sha-1',
  code: 0x11,
  encode: (input) => coerce(crypto.createHash('sha1').update(input).digest())
})
