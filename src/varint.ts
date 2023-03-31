import varint from './vendor/varint.js'

export const decode = (data: Uint8Array, offset = 0): [number, number] => {
  const code = varint.decode(data, offset)
  return [code, varint.decode.bytes]
}

export const encodeTo = (int: number, target: Uint8Array, offset = 0): Uint8Array => {
  varint.encode(int, target, offset)
  return target
}

export const encodingLength = (int: number): number => {
  return varint.encodingLength(int)
}
