const { coerce } = require('../bytes')

const raw = buff => coerce(buff)

module.exports = {
  encode: raw,
  decode: raw,
  name: 'raw',
  code: 85
}
