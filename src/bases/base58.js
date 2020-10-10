import baseX from '../../vendor/base-x.js'
import { coerce } from '../bytes.js'
import { from } from './base.js'

/**
 * @param {string} alphabet
 */
const implement = (alphabet) => {
  const { encode, decode } = baseX(alphabet)
  return {
    encode,
    /**
     * @param {string} text
     */
    decode: text => coerce(decode(text))
  }
}

export const base58btc = from({
  name: 'base58btc',
  prefix: 'z',
  ...implement('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')
})

export const base58flickr = from({
  name: 'base58flickr',
  prefix: 'Z',
  ...implement('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ')
})
