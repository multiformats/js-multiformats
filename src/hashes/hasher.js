// @ts-check

import * as Digest from './digest.js'

/**
 * @template {string} Name
 * @template {number} Code
 * @param {Object} options
 * @param {Name} options.name
 * @param {Code} options.code
 * @param {(input: Uint8Array) => Await<Uint8Array>} options.encode
 */
export const from = ({ name, code, encode }) => new Hasher(name, code, encode)

/**
 * Hasher represents a hashing algorithm implementation that produces as
 * `MultihashDigest`.
 *
 * @template {string} Name
 * @template {number} Code
 * @implements {UnihashHasher<Code>}
 * @implements {MultihashHasher<Code>}
 */
export class Hasher {
  /**
   * @param {Name} name
   * @param {Code} code
   * @param {(input: Uint8Array) => Await<Uint8Array>} encode
   */
  constructor (name, code, encode) {
    this.name = name
    this.code = code
    this.encode = encode
  }

  // UnihashHasher interface
  /**
   * @param {Uint8Array} bytes
   * @returns {Promise<Digest.Digest<Code, number>>}
   */
  async digestBytes (bytes) {
    if (bytes instanceof Uint8Array) {
      const digest = await this.encode(bytes)
      return Digest.create(this.code, digest)
    } else {
      throw Error('Unknown type, must be binary type')
    }
  }

  // MultihashHasher interface
  get hashers () {
    return { [this.code]: this }
  }

  /**
   * @param {HashInput<Code>} input
   * @returns {Promise<Digest.Digest<Code, number>>}
   */
  async digest ({ code, bytes }) {
    if (code === this.code) {
      return await this.digestBytes(bytes)
    } else {
      throw Error(`Unsupported hashing algorithm (code: ${code}), this hasher only supports: ${this.code}`)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MultihashHasher<OtherCode>} other
   * @returns {MultihashHasher<Code|OtherCode>}
   */
  or (other) {
    /** @type {UnihashHasher<Code|OtherCode>} */
    const base = this
    /** @type {MultihashHasher<Code|OtherCode>} */
    const extension = (other)
    return new ComposedHasher(base, {
      ...extension.hashers,
      [base.code]: base
    })
  }
}

/**
 * @template {number} Code
 * @implements {UnihashHasher<Code>}
 * @implements {MultihashHasher<Code>}
 */
class ComposedHasher {
  /**
   * @param {UnihashHasher<Code>} defaultHasher
   * @param {Record<Code, UnihashHasher<Code>>} hashers
   */
  constructor (defaultHasher, hashers) {
    this.defaultHasher = defaultHasher
    this.hashers = hashers
  }

  // UnihashHasher interface
  get code () {
    return this.defaultHasher.code
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {Promise<Digest.Digest<Code, number>>}
   */
  async digestBytes (bytes) {
    return await this.defaultHasher.digestBytes(bytes)
  }

  // Multihasher interface

  /**
   * @param {HashInput<Code>} input
   * @returns {Promise<Digest.Digest<Code, number>>}
   */
  async digest ({ code, bytes }) {
    const hasher = this.hashers[code]
    if (hasher) {
      return await hasher.digestBytes(bytes)
    } else {
      throw Error(`Unsupported hashing algorithm (code: ${code}), this hasher only supports: ${Object.keys(this.hashers)} `)
    }
  }

  /**
   * @template {number} OtherCode
   * @param {MultihashHasher<OtherCode>} other
   * @returns {MultihashHasher<Code|OtherCode>}
   */
  or (other) {
    /** @type {MultihashHasher<Code|OtherCode>} */
    const base = (this)
    /** @type {MultihashHasher<Code|OtherCode>} */
    const extension = (other)
    return new ComposedHasher(this.defaultHasher, {
      ...extension.hashers,
      ...base.hashers
    })
  }
}

/**
 * @template {number} Code
 * @typedef {import('./interface').Hasher<Code>} UnihashHasher
 */

/**
 * @template {number} Code
 * @typedef {import('./interface').MultihashHasher<Code>} MultihashHasher
 */

/**
 * @template {number} Code
 * @typedef {import('./interface').HashInput<Code>} HashInput
 */

/**
 * @template T
 * @typedef {import('./interface').Await<T>} Await
 */
