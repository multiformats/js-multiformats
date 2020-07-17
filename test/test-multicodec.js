/* globals describe, it */
import * as bytes from 'multiformats/bytes.js'
import assert from 'assert'
import multiformats from 'multiformats/basics.js'
const same = assert.deepStrictEqual
const test = it

const testThrow = async (fn, message) => {
  try {
    await fn()
  } catch (e) {
    if (e.message !== message) throw e
    return
  }
  throw new Error('Test failed to throw')
}

describe('multicodec', () => {
  const { multicodec } = multiformats

  test('encode/decode raw', () => {
    const buff = multicodec.encode(bytes.fromString('test'), 'raw')
    same(buff, bytes.fromString('test'))
    same(multicodec.decode(buff, 'raw'), bytes.fromString('test'))
  })

  test('encode/decode json', () => {
    const buff = multicodec.encode({ hello: 'world' }, 'json')
    same(buff, bytes.fromString(JSON.stringify({ hello: 'world' })))
    same(multicodec.decode(buff, 'json'), { hello: 'world' })
  })

  test('raw cannot encode string', async () => {
    await testThrow(() => multicodec.encode('asdf', 'raw'), 'Unknown type, must be binary type')
  })

  test('get failure', async () => {
    await testThrow(() => multicodec.get(true), 'Unknown key type')
    let msg = 'Do not have multiformat entry for "8237440"'
    await testThrow(() => multicodec.get(8237440), msg)
    msg = 'Do not have multiformat entry for "notfound"'
    await testThrow(() => multicodec.get('notfound'), msg)
  })

  test('add with function', () => {
    let calls = 0
    multicodec.add((...args) => {
      calls++
      same(args.length, 1, 'called with single arg')
      assert(args[0] === multiformats, 'called with multiformats as argument')
      return { code: 200, name: 'blip', encode: (a) => a[1], decode: (a) => a }
    })
    same(calls, 1, 'called exactly once')
    const two = bytes.fromString('two')
    const three = bytes.fromString('three')
    same(multicodec.encode(['one', two, three], 'blip'), two, 'new codec encoder was added')
    same(multicodec.decode(three, 200), three, 'new codec decoder was added')
  })
  test('has', async () => {
    same(multicodec.has('json'), true)
    same(multicodec.has(0x0200), true)
    await testThrow(() => multicodec.has({}), 'Unknown type')
  })
})
