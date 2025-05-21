export const empty = new Uint8Array(0)

export function toHex (d: Uint8Array): string {
  return d.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '')
}

export function fromHex (hex: string): Uint8Array {
  const hexes = hex.match(/../g)
  return hexes != null ? new Uint8Array(hexes.map(b => parseInt(b, 16))) : empty
}

export function equals (aa: Uint8Array, bb: Uint8Array): boolean {
  if (aa === bb) { return true }
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

export function coerce (o: ArrayBufferView | ArrayBuffer | Uint8Array): Uint8Array {
  if (o instanceof Uint8Array && o.constructor.name === 'Uint8Array') { return o }
  if (o instanceof ArrayBuffer) { return new Uint8Array(o) }
  if (ArrayBuffer.isView(o)) {
    return new Uint8Array(o.buffer, o.byteOffset, o.byteLength)
  }
  throw new Error('Unknown type, must be binary type')
}

export function isBinary (o: unknown): o is ArrayBuffer | ArrayBufferView {
  return o instanceof ArrayBuffer || ArrayBuffer.isView(o)
}

export function fromString (str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export function toString (b: Uint8Array): string {
  return new TextDecoder().decode(b)
}
