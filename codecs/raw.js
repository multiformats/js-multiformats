const { Buffer } = require('buffer')

const raw = buff => {
  if (!Buffer.isBuffer(buff)) throw new Error('Only buffer instances can be used w/ raw codec')
  return buff
}

module.exports = {
  encode: raw,
  decode: raw,
  name: 'raw',
  code: 85
}
