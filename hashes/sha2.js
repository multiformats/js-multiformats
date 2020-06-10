import crypto from 'crypto'

const bufferToUint8Array = (buffer) => {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

const sha256 = async data => bufferToUint8Array(crypto.createHash('sha256').update(data).digest())
const sha512 = async data => bufferToUint8Array(crypto.createHash('sha512').update(data).digest())

const hashes = [
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
hashes.__browser = false
export default hashes
