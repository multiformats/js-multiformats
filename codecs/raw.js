const raw = buff => {
  if (Object.prototype.toString.call(buff) !== '[object Uint8Array]') {
    throw new Error('Only Uint8Array instances can be used w/ raw codec')
  }
  return buff
}

module.exports = {
  encode: raw,
  decode: raw,
  name: 'raw',
  code: 85
}
