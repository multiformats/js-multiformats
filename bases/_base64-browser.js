/* globals btoa, atob */
const encode = b => btoa([].reduce.call(b, (p, c) => p + String.fromCharCode(c), ''))
const decode = str => Uint8Array.from(atob(str), c => c.charCodeAt(0))
const __browser = true
export { encode, decode, __browser }
