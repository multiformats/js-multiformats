// @ts-check

import { coerce } from '../bytes.js'
import { codec } from './codec.js'

export const { name, code, decode, encode, decoder, encoder } = codec({
  name: 'raw',
  code: 85,
  decode: coerce,
  encode: coerce
})
