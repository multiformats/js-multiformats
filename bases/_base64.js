import { coerce } from 'multiformats/bytes.js'
const encode = o => Buffer.from(o).toString('base64')
const decode = s => coerce(Buffer.from(s, 'base64'))
const __browser = false
export { encode, decode, __browser }
