/* globals it */
const modules = {}
modules.multiformats = require('multiformats')
modules['multiformats/basics.js'] = require('multiformats/basics.js')
modules['multiformats/bytes.js'] = require('multiformats/bytes.js')
modules['multiformats/cid.js'] = require('multiformats/cid.js')
modules['multiformats/legacy.js'] = require('multiformats/legacy.js')
modules['multiformats/bases/base16.js'] = require('multiformats/bases/base16.js')
modules['multiformats/bases/base32.js'] = require('multiformats/bases/base32.js')
modules['multiformats/bases/base58.js'] = require('multiformats/bases/base58.js')
modules['multiformats/bases/base64.js'] = require('multiformats/bases/base64.js')
modules['multiformats/hashes/sha2-browser.js'] = require('multiformats/hashes/sha2-browser.js')
modules['multiformats/hashes/sha2.js'] = require('multiformats/hashes/sha2.js')
modules['multiformats/codecs/json.js'] = require('multiformats/codecs/json.js')
modules['multiformats/codecs/raw.js'] = require('multiformats/codecs/raw.js')

const test = it

test('multiformat imports basics', () => {
  for (const [, value] of Object.entries(modules)) {
    if (typeof value === 'undefined') throw new Error('Missing export')
  }
})
