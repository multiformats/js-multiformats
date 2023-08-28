// @ts-check

import { fromString, toString } from '../bytes.js'
import { from } from './base.js'

export const identity = from({
  prefix: '\x00',
  name: 'identity',
  encode: (buf) => toString(buf),
  decode: (str) => fromString(str)
})
