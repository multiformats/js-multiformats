import { create } from 'multiformats/index.js'
import raw from 'multiformats/codecs/raw.js'
import json from 'multiformats/codecs/json.js'
import base32 from 'multiformats/bases/base32.js'
import base64 from 'multiformats/bases/base64.js'
import sha2 from 'multiformats/hashes/sha2.js'

const multiformats = create()
multiformats.multihash.add(sha2)
multiformats.multicodec.add([raw, json])
multiformats.multibase.add([base32, base64])

export default multiformats
