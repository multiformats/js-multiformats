const multiformats = require('./')()
const raw = require('./codecs/raw')
const json = require('./codecs/json')
const base32 = require('./bases/base32')
const base64 = require('./bases/base64')
const sha2 = require('./hashes/sha2')

multiformats.multihash.add(sha2)
multiformats.multicodec.add([raw, json])
multiformats.multibase.add([base32, base64])

module.exports = multiformats
