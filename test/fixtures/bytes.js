import { empty } from '../../src/bytes.js'

/**
 * @param {Uint8Array} d
 */
const toHex = d => d.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '')

/**
 * @param {string} hex
 */
const fromHex = hex => {
  const hexes = hex.match(/../g)
  return hexes ? new Uint8Array(hexes.map(b => parseInt(b, 16))) : empty
}

export { fromHex, toHex }
