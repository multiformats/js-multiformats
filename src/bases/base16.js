// @ts-check

import { fromHex, toHex } from '../bytes.js'
import { withAlphabet } from './base.js'

export const base16 = withAlphabet({
  prefix: 'f',
  name: 'base16',
  alphabet: '0123456789abcdef',
  encode: toHex,
  decode: fromHex
})
