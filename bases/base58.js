import baseX from 'base-x'
import { coerce } from 'multiformats/bytes.js'
import { Buffer } from 'buffer'

const wrap = obj => ({
  encode: b => obj.encode(Buffer.from(b)),
  decode: s => coerce(obj.decode(s))
})

const btc = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const flickr = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'

export default [
  { name: 'base58btc', prefix: 'z', ...wrap(baseX(btc)) },
  { name: 'base58flickr', prefix: 'Z', ...wrap(baseX(flickr)) }
]
