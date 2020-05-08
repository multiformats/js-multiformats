const toHex = d => d.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '')
const fromHex = hex => {
  if (!hex.length) return new Uint8Array(0)
  return new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)))
}

const equals = (aa, bb) => {
  if (aa.byteLength !== bb.byteLength) {
    return false
  }

  for (let ii = 0; ii < aa.byteLength; ii++) {
    if (aa[ii] !== bb[ii]) {
      return false
    }
  }

  return true
}

const TypedArray = Object.getPrototypeOf(Int8Array)
const isTypedArray = obj => obj instanceof TypedArray

const coerce = o => {
  if (o instanceof Uint8Array && o.constructor.name === 'Uint8Array') return o
  if (o instanceof ArrayBuffer) return new Uint8Array(o)
  if (o instanceof DataView || isTypedArray(o)) {
    return new Uint8Array(o.buffer, o.byteOffset, o.byteLength)
  }
  throw new Error('Unknown type, must be binary type')
}

const isBinary = o => {
  if (o instanceof DataView) return true
  if (o instanceof ArrayBuffer) return true
  if (isTypedArray(o)) return true
  return false
}

const fromString = str => (new TextEncoder()).encode(str)

exports.equals = equals
exports.coerce = coerce
exports.isBinary = isBinary
exports.fromHex = fromHex
exports.toHex = toHex
exports.fromString = fromString
