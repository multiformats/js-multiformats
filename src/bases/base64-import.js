import { coerce } from '../bytes.js'
import create from './base64.js'
const encode = o => Buffer.from(o).toString('base64')
const decode = s => coerce(Buffer.from(s, 'base64'))
const __browser = false
export default create({ encode, decode, __browser })
