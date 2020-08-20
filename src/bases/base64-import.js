
// @ts-check

import { coerce } from '../bytes.js'
import b64 from './base64.js'

const { base64, base64pad, base64url, base64urlpad, __browser } = b64({
  encode: o => Buffer.from(o).toString('base64'),
  decode: s => coerce(Buffer.from(s, 'base64')),
  __browser: false
})

export { base64, base64pad, base64url, base64urlpad, __browser }
