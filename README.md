# multiformats

This library is for building an interface for working with various
inter-related multiformat technologies (multicodec, multihash, multibase,
and CID).

The interface contains all you need for encoding and decoding the basic
structures with no codec information, codec encoder/decoders, base encodings
or hashing functions. You can then add codec info, codec encoders/decoders,
base encodings, and hashing functions to the interface.

This allows you to pass around an interface containing only the code you need
which can greatly reduce dependencies and bundle size.

```js
import * as CID from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import dagcbor from '@ipld/dag-cbor'
import { base32 } from 'multiformats/bases/base32'
import { base58btc } from 'multiformats/bases/base58'

const bytes = dagcbor.encode({ hello: 'world' })

const hash = await sha256.digest(bytes)
// raw codec is the only codec that is there by default
const cid = CID.create(1, dagcbor.code, hash)
```

However, if you're doing this much you should probably use multiformats
with the `Block` API.

```js
// Import basics package with dep-free codecs, hashes, and base encodings
import { block } from 'multiformats/basics'
import { sha256 } from 'multiformats/hashes/sha2'
import dagcbor from '@ipld/dag-cbor'

const encoder = block.encoder(dagcbor, { hasher: sha256 })
const hello = encoder.encode({ hello: 'world' })
const cid = await hello.cid()
```

# Plugins

By default, no base encodings, hash functions, or codec implementations are included with `multiformats`.
However, you can import the following bundles to get a `multiformats` interface with them already configured.

| bundle | bases | hashes | codecs |
|---|---|---|---|
| `multiformats/basics` | `base32`, `base64` | `sha2-256`, `sha2-512` | `json`, `raw` |

## Base Encodings (multibase)

| bases | import | repo |
 --- | --- | --- |
`base16` | `multiformats/bases/base16` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |
`base32`, `base32pad`, `base32hex`, `base32hexpad`, `base32z` | `multiformats/bases/base32` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |
`base64`, `base64pad`, `base64url`, `base64urlpad` | `multiformats/bases/base64` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |
`base58btc`, `base58flick4` | `multiformats/bases/base58` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/bases) |

## Hash Functions (multihash)

| hashes | import | repo |
| --- | --- | --- |
| `sha2-256`, `sha2-512` | `multiformats/hashes/sha2` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/hashes) |
| `sha3-224`, `sha3-256`, `sha3-384`,`sha3-512`, `shake-128`, `shake-256`, `keccak-224`, `keccak-256`, `keccak-384`, `keccak-512` | `@multiformats/sha3` | [multiformats/js-sha3](https://github.com/multiformats/js-sha3) |
| `murmur3-128`, `murmur3-32` | `@multiformats/murmur3` | [multiformats/js-murmur3](https://github.com/multiformats/js-murmur3) |

## Codec Implementations (multicodec)

| codec | import | repo |
| --- | --- | --- |
| `raw` | `multiformats/codecs/raw` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/codecs) |
| `json` | `multiformats/codecs/json` | [multiformats/js-multiformats](https://github.com/multiformats/js-multiformats/tree/master/codecs) |
| `dag-cbor` | `@ipld/dag-cbor` | [ipld/js-dag-cbor](https://github.com/ipld/js-dag-cbor) |
| `dag-json` | `@ipld/dag-json` | [ipld/js-dag-json](https://github.com/ipld/js-dag-json) |

# API

