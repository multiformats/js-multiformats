/* globals describe, it */
'use strict'
const assert = require('assert')
const multiformat = require('../')()
const test = it

describe('errors and type checking', () => {
  test('add argument validation', () => {
    assert.throws(() => multiformat.add())
    assert.throws(() => multiformat.add({ code: 'nope' }), /.*integer code.*/)
    assert.throws(() => multiformat.add({ code: 200, name: () => {} }), /.*string name.*/)
    assert.throws(() => multiformat.add({ code: 200, name: 'blip', encode: false }), /.*encode .* function.*/)
    assert.throws(() => multiformat.add({ code: 200, name: 'blip', encode: () => {}, decode: 'nope' }), /.*decode .* function.*/)
    assert.doesNotThrow(() => multiformat.add({ code: 200, name: 'blip', encode: () => {}, decode: () => {} }))
  })
})
