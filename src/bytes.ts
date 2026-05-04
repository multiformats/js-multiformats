export const empty = new Uint8Array(0)

export function toHex (d: Uint8Array): string {
  return d.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '')
}

export function fromHex (hex: string): Uint8Array<ArrayBuffer> {
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

export function coerce (o: ArrayBufferView | ArrayBuffer | Uint8Array): Uint8Array<ArrayBuffer> {
  if (o instanceof Uint8Array && o.constructor.name === 'Uint8Array') {
    return toArrayBufferBackedArray(o)
  }
  if (o instanceof ArrayBuffer) {
    return new Uint8Array(o)
  }
  if (ArrayBuffer.isView(o)) {
    return toArrayBufferBackedArray(new Uint8Array(o.buffer, o.byteOffset, o.byteLength))
  }
  throw new Error('Unknown type, must be binary type')
}

export function isBinary (o: unknown): o is ArrayBuffer | ArrayBufferView {
  return o instanceof ArrayBuffer || ArrayBuffer.isView(o)
}

export function fromString (str: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(str)
}

export function toString (b: Uint8Array): string {
  return new TextDecoder().decode(b)
}

function isByteArrayWithArrayBuffer (b?: Uint8Array): b is Uint8Array<ArrayBuffer> {
  return b?.buffer instanceof ArrayBuffer
}

/**
 * Ensures `b` is backed by an ArrayBuffer - if not a new Uint8Array will be
 * created and the contents of `b` copied into it.
 */
export function toArrayBufferBackedArray (b: Uint8Array): Uint8Array<ArrayBuffer> {
  if (isByteArrayWithArrayBuffer(b)) {
    return b
  }

  return b.slice()
}
