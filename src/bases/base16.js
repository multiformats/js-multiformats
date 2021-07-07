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

export const base16upper = withAlphabet({
  prefix: 'F',
  name: 'base16upper',
  alphabet: '0123456789ABCDEF',
  encode: toHex,
  decode: fromHex
})
