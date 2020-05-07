const sha = name => async data => Uint8Array.from(await window.crypto.subtle.digest(name, data))

module.exports = [
  {
    name: 'sha2-256',
    encode: sha('SHA-256'),
    code: 0x12
  },
  {
    name: 'sha2-512',
    encode: sha('SHA-512'),
    code: 0x13
  }
]
module.exports.___browser = true
