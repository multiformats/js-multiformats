/* globals btoa, atob */
import create from './base64.js'
const encode = b => btoa([].reduce.call(b, (p, c) => p + String.fromCharCode(c), ''))
const decode = str => Uint8Array.from(atob(str), c => c.charCodeAt(0))
const __browser = true
export default create({ encode, decode, __browser })
