import { coerce } from 'multiformats/bytes.js'

const raw = buff => coerce(buff)

export default {
  encode: raw,
  decode: raw,
  name: 'raw',
  code: 85
}
