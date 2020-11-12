// @ts-check

import { from } from './hasher.js'
import { coerce } from '../bytes.js'

export default from({
  name: 'identity',
  code: 0x0,
  encode: (input) => coerce(input)
})
