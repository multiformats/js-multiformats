import * as Digest from './digest.js'
import type { MultihashHasher } from './interface.js'

type Await<T> = Promise<T> | T

export function from <Name extends string, Code extends number> ({ name, code, encode }: { name: Name, code: Code, encode(input: Uint8Array): Await<Uint8Array> }): Hasher<Name, Code> {
  return new Hasher(name, code, encode)
}

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 */
export class Hasher<Name extends string, Code extends number> implements MultihashHasher<Code> {
  readonly name: Name
  readonly code: Code
  readonly encode: (input: Uint8Array) => Await<Uint8Array>

  constructor (name: Name, code: Code, encode: (input: Uint8Array) => Await<Uint8Array>) {
    this.name = name
    this.code = code
    this.encode = encode
  }

  digest (input: Uint8Array): Await<Digest.Digest<Code, number>> {
    if (input instanceof Uint8Array) {
      const result = this.encode(input)
      return result instanceof Uint8Array
        ? Digest.create(this.code, result)
        /* c8 ignore next 1 */
        : result.then(digest => Digest.create(this.code, digest))
    } else {
      throw Error('Unknown type, must be binary type')
      /* c8 ignore next 1 */
    }
  }
}
