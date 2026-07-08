import varint from './vendor/varint.js'

export function decode (data: Uint8Array, offset = 0): [number, number] {
  const code = varint.decode(data, offset)
  const length = varint.decode.bytes
  if (length > 9) {
    throw new RangeError('Invalid varint: too long')
  }
  if (length > 1 && data[offset + length - 1] === 0) {
    throw new RangeError('Invalid varint: not minimally encoded')
  }
  return [code, length]
}

export function encodeTo <T extends ArrayBufferLike> (int: number, target: Uint8Array<T>, offset = 0): Uint8Array<T> {
  varint.encode(int, target, offset)
  return target
}

export function encodingLength (int: number): number {
  return varint.encodingLength(int)
}
