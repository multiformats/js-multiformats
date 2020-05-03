const crypto = require('crypto')

const sha256 = async data => crypto.createHash('sha256').update(data).digest().buffer
const sha512 = async data => crypto.createHash('sha512').update(data).digest().buffer

module.exports = [
  {
    name: 'sha2-256',
    encode: sha256,
    code: 0x12
  },
  {
    name: 'sha2-512',
    encode: sha512,
    code: 0x13
  }
]
