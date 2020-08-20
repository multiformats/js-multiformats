// @ts-check

import { codec } from './codec.js'

export default codec({
  name: 'json',
  code: 0x0200,
  encode: json => new TextEncoder().encode(JSON.stringify(json)),
  decode: bytes => JSON.parse(new TextDecoder().decode(bytes))
})
