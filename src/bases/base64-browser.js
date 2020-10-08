/* globals btoa, atob */
import b64 from './base64.js'

const { base64, base64pad, base64url, base64urlpad, __browser } = b64({
  encode: b => btoa(b.reduce((p, c) => p + String.fromCharCode(c), '')),
  decode: str => Uint8Array.from(atob(str), c => c.charCodeAt(0)),
  __browser: true
})

export { base64, base64pad, base64url, base64urlpad, __browser }
