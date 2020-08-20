import varint from 'varint'

/**
 * @param {Uint8Array} data
 * @returns {[number, number]}
 */
export const decode = (data) => {
  const code = varint.decode(data)
  return [code, varint.decode.bytes]
}

/**
 * @param {number} int
 * @returns {Uint8Array}
 */
export const encode = (int) => {
  if (cache.has(int)) return cache.get(int)
  const bytes = new Uint8Array(varint.encodingLength(int))
  varint.encode(int, bytes, 0)
  cache.set(int, bytes)

  return bytes
}

/**
 * @param {number} int
 * @param {Uint8Array} target
 * @param {number} [offset=0]
 */
export const encodeTo = (int, target, offset = 0) => {
  const cached = cache.get(int)
  if (cached) {
    target.set(target, offset)
  } else {
    varint.encode(int, target, 0)
  }
}

/**
 * @param {number} int
 * @returns {number}
 */
export const encodingLength = (int) => {
  return varint.encodingLength(int)
}

const cache = new Map()
