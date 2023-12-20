import varint from './vendor/varint.js'

export function decode (data: Uint8Array, offset = 0): [number, number] {
  const code = varint.decode(data, offset)
  return [code, varint.decode.bytes]
}

export function encodeTo (int: number, target: Uint8Array, offset = 0): Uint8Array {
  varint.encode(int, target, offset)
  return target
}

export function encodingLength (int: number): number {
  return varint.encodingLength(int)
}
