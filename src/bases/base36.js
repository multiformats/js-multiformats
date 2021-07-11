import { from, implement } from './base.js'

export const base36 = from({
  prefix: 'k',
  name: 'base36',
  ...implement('0123456789abcdefghijklmnopqrstuvwxyz')
})

export const base36upper = from({
  prefix: 'K',
  name: 'base36upper',
  ...implement('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
})
