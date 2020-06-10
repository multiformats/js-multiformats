const sha = name => async data => new Uint8Array(await window.crypto.subtle.digest(name, data))

const hashes = [
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
hashes.__browser = true

export default hashes
