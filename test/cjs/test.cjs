/* globals it */
const assert = require('assert')
const multiformats = require('multiformats')

const same = assert.deepStrictEqual
const test = it

test('multiformat imports basics', () => {
  same(typeof multiformats.encode, 'function')
  same(typeof multiformats.decode, 'function')
})
