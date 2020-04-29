const { Buffer } = require('buffer')

module.exports = {
  encode: obj => Buffer.from(JSON.stringify(obj)),
  decode: buff => JSON.parse(buff.toString()),
  name: 'json',
  code: 0x0200
}
