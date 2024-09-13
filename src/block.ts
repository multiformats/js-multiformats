import { bytes as binary, CID } from './index.js'
import type * as API from './interface.js'

function readonly ({ enumerable = true, configurable = false } = {}): { enumerable: boolean, configurable: boolean, writable: false } {
  return { enumerable, configurable, writable: false }
}

function * linksWithin (path: [string | number, string], value: any): Iterable<[string, CID]> {
  if (value != null && typeof value === 'object') {
    if (Array.isArray(value)) {
      for (const [index, element] of value.entries()) {
        const elementPath = [...path, index]
        const cid = CID.asCID(element)
        if (cid != null) {
          yield [elementPath.join('/'), cid]
        } else if (typeof element === 'object') {
          yield * links(element, elementPath)
        }
      }
    } else {
      const cid = CID.asCID(value)
      if (cid != null) {
        yield [path.join('/'), cid]
      } else {
        yield * links(value, path)
      }
    }
  }
}

function * links <T> (source: T, base: Array<string | number>): Iterable<[string, CID]> {
  if (source == null || source instanceof Uint8Array) {
    return
  }
  const cid = CID.asCID(source)
  if (cid != null) {
    yield [base.join('/'), cid]
  }
  for (const [key, value] of Object.entries(source)) {
    const path = [...base, key] as [string | number, string]
    yield * linksWithin(path, value)
  }
}

function * treeWithin (path: [string | number, string], value: any): Iterable<string> {
  if (Array.isArray(value)) {
    for (const [index, element] of value.entries()) {
      const elementPath = [...path, index]
      yield elementPath.join('/')
      if (typeof element === 'object' && (CID.asCID(element) == null)) {
        yield * tree(element, elementPath)
      }
    }
  } else {
    yield * tree(value, path)
  }
}

function * tree <T> (source: T, base: Array<string | number>): Iterable<string> {
  if (source == null || typeof source !== 'object') {
    return
  }
  for (const [key, value] of Object.entries(source)) {
    const path = [...base, key] as [string | number, string]
    yield path.join('/')
    if (value != null && !(value instanceof Uint8Array) && typeof value === 'object' && (CID.asCID(value) == null)) {
      yield * treeWithin(path, value)
    }
  }
}

function get <T> (source: T, path: string[]): API.BlockCursorView<unknown> {
  let node = source as Record<string, any>
  for (const [index, key] of path.entries()) {
    node = node[key]
    if (node == null) {
      throw new Error(`Object has no property at ${path.slice(0, index + 1).map(part => `[${JSON.stringify(part)}]`).join('')}`)
    }
    const cid = CID.asCID(node)
    if (cid != null) {
      return { value: cid, remaining: path.slice(index + 1).join('/') }
    }
  }
  return { value: node }
}

/**
 * @template T - Logical type of the data encoded in the block
 * @template C - multicodec code corresponding to codec used to encode the block
 * @template A - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template V - CID version
 */
export class Block<T, C extends number, A extends number, V extends API.Version> implements API.BlockView<T, C, A, V> {
  readonly cid: CID<T, C, A, V>
  readonly bytes: API.ByteView<T>
  readonly value: T
  readonly asBlock: this

  constructor ({ cid, bytes, value }: { cid: CID<T, C, A, V>, bytes: API.ByteView<T>, value: T }) {
    if (cid == null || bytes == null || typeof value === 'undefined') { throw new Error('Missing required argument') }

    this.cid = cid
    this.bytes = bytes
    this.value = value
    this.asBlock = this

    // Mark all the properties immutable
    Object.defineProperties(this, {
      cid: readonly(),
      bytes: readonly(),
      value: readonly(),
      asBlock: readonly()
    })
  }

  links (): Iterable<[string, CID<unknown, number, number, API.Version>]> {
    return links(this.value, [])
  }

  tree (): Iterable<string> {
    return tree(this.value, [])
  }

  get (path = '/'): API.BlockCursorView<unknown> {
    return get(this.value, path.split('/').filter(Boolean))
  }
}

interface EncodeInput <T, Code extends number, Alg extends number> {
  value: T
  codec: API.BlockEncoder<Code, T>
  hasher: API.MultihashHasher<Alg>
}

/**
 * @template T - Logical type of the data encoded in the block
 * @template Code - multicodec code corresponding to codec used to encode the block
 * @template Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 */
export async function encode <T, Code extends number, Alg extends number> ({ value, codec, hasher }: EncodeInput<T, Code, Alg>): Promise<API.BlockView<T, Code, Alg>> {
  if (typeof value === 'undefined') throw new Error('Missing required argument "value"')
  if (codec == null || hasher == null) throw new Error('Missing required argument: codec or hasher')

  const bytes = codec.encode(value)
  const hash = await hasher.digest(bytes)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const cid = CID.create(
    1,
    codec.code,
    hash
  ) as CID<T, Code, Alg, 1>

  return new Block({ value, bytes, cid })
}

interface DecodeInput <T, Code extends number, Alg extends number> {
  bytes: API.ByteView<T>
  codec: API.BlockDecoder<Code, T>
  hasher: API.MultihashHasher<Alg>
}

/**
 * @template T - Logical type of the data encoded in the block
 * @template Code - multicodec code corresponding to codec used to encode the block
 * @template Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 */
export async function decode <T, Code extends number, Alg extends number> ({ bytes, codec, hasher }: DecodeInput<T, Code, Alg>): Promise<API.BlockView<T, Code, Alg>> {
  if (bytes == null) throw new Error('Missing required argument "bytes"')
  if (codec == null || hasher == null) throw new Error('Missing required argument: codec or hasher')

  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const cid = CID.create(1, codec.code, hash) as CID<T, Code, Alg, 1>

  return new Block({ value, bytes, cid })
}

type CreateUnsafeInput <T, Code extends number, Alg extends number, V extends API.Version> = {
  cid: API.Link<T, Code, Alg, V>
  value: T
  codec?: API.BlockDecoder<Code, T>
  bytes: API.ByteView<T>
} | {
  cid: API.Link<T, Code, Alg, V>
  value?: undefined
  codec: API.BlockDecoder<Code, T>
  bytes: API.ByteView<T>
}

/**
 * @template T - Logical type of the data encoded in the block
 * @template Code - multicodec code corresponding to codec used to encode the block
 * @template Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template V - CID version
 */
export function createUnsafe <T, Code extends number, Alg extends number, V extends API.Version> ({ bytes, cid, value: maybeValue, codec }: CreateUnsafeInput<T, Code, Alg, V>): API.BlockView<T, Code, Alg, V> {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const value = maybeValue !== undefined
    ? maybeValue
    : (codec?.decode(bytes))

  if (value === undefined) throw new Error('Missing required argument, must either provide "value" or "codec"')

  return new Block({
    cid: cid as CID<T, Code, Alg, V>,
    bytes,
    value
  })
}

interface CreateInput <T, Code extends number, Alg extends number, V extends API.Version> {
  bytes: API.ByteView<T>
  cid: API.Link<T, Code, Alg, V>
  hasher: API.MultihashHasher<Alg>
  codec: API.BlockDecoder<Code, T>
}

/**
 * @template T - Logical type of the data encoded in the block
 * @template Code - multicodec code corresponding to codec used to encode the block
 * @template Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template V - CID version
 */
export async function create <T, Code extends number, Alg extends number, V extends API.Version> ({ bytes, cid, hasher, codec }: CreateInput<T, Code, Alg, V>): Promise<API.BlockView<T, Code, Alg, V>> {
  if (bytes == null) throw new Error('Missing required argument "bytes"')
  if (hasher == null) throw new Error('Missing required argument "hasher"')
  const value = codec.decode(bytes)
  const hash = await hasher.digest(bytes)
  if (!binary.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match bytes')
  }

  return createUnsafe({
    bytes,
    cid,
    value,
    codec
  })
}
