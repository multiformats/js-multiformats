import { create } from './index.js'
import raw from './codecs/raw.js'
import json from './codecs/json.js'
import base32 from './bases/base32.js'
import sha2 from './hashes/sha2.js'

export default base64 => {
  const multiformats = create()
  multiformats.multihash.add(sha2)
  multiformats.multicodec.add([raw, json])
  multiformats.multibase.add([base32, base64])
  return multiformats
}
