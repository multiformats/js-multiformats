import { from, implement } from './base.js'

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
