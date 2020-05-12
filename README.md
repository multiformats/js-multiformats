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
const { multihash, multicodec, CID } = require('multiformats')()
const sha2 = require('@multiformats/sha2')
const dagcbor = require('@ipld/dag-cbor')
multihash.add(sha2)
multicodec.add(dagcbor)

const buffer = multicodec.encode({ hello, 'world' }, 'dag-cbor')
const hash = await multiformats.multihash.hash(buffer, 'sha2-256')
// raw codec is the only codec that is there by default
const cid = new multiformats.CID(1, 'raw', hash)
```

However, if you're doing this much you should probably use multiformats
with the `Block` API.

```js
// Import basics package with dep-free codecs, hashes, and base encodings
const multiformats = require('multiformats/basics')
const dagcbor = require('@ipld/dag-cbor')
multiformats.multicodec.add(dagcbor)
const Block = require('@ipld/block')(multiformats)
const block = Block.encoder({ hello: world }, 'dag-cbor')
const cid = await block.cid()
```

# API

# multiformats([table])

Returns a new multiformats interface.

Can optionally pass in a table of multiformat entries. For instance,
if you want to add all the metadata entires in the multiformat table
you can do the following:

```js
const intTable = require('multicodec/src/int-table')
const table = Array.from(intTable.entries())
const multiformat = require('multiformat')(table)
```

This will give you name properties for any parsed CID's and multihashes.
It will not include any of the codec or hash function implementations.

# multihash

## multihash.encode

## multihash.decode

## multihash.validate

## multihash.add

## multihash.hash

# multicodec

## multicodec.encode

## multicodec.decode

## multicodec.add

# multibase

## multibase.encode

## multibase.decode

## multibase.add

# CID

Changes from `cids`:

* All base encodings are cached indefinitely.
* CID's can be created without any multiformat data.
  * The new API is entirely based on parsing the varints
    so it doesn't need the table metadata in order to associate
    string names.

There are also numerous deprecations. These deprecations all stem from the
fact that we no longer know the full set of available multicodec information.
It's actually quite possible to provide a CID interface without this, you can
still do everything you used to do, you just need to use ints instead of strings
and do some of the fancier V0 coercions outside this library.

Deprection List:
  * the multibase encoding is no longer cached during instantiation.
    * this being indeterministic was causing some nasty problems downstream
      since `toString()` needs to be used as a cache key and it's not possible
      to encode V1 into anything but base58btc. this means that you can't have
      deterministic hash keys without also requiring base58btc support unless
      we remove this feature.
  * no longer accept bare multihash buffers as V0, only base58btc encoded strings
    or the complete set of parts with the multihash as the third argument.
    * The logic for treating these as V0 was problematic and could lead to
      unwanted errors. In practice, the places we need to handle V0 are known
      and we can move this logic there if necessary and then instantiate a CID
      with all the necessary args.
    * Some of the prior code relied on knowing the full set of possible base
      prefixes, which we can no longer do.
  * no more .toBaseEncodedString(), just toString()
  * no more .multiBase
  * no more .prefix()
  * no more .codec
    * new property ".code" is the multiformat integer.
    * this is going to be a painful transition but we have to get off of using
      the string if we ever want to drop the full table. while the DX for this is
      nice it forces into bloating the bundle and makes using new codecs very
      painful.

```
/*
* Create a new CID.
*
* The algorithm for argument input is roughly:
* ```
* if (cid)
*   -> create a copy
* else if (str)
*   if (1st char is on multibase table) -> CID String
*   else -> bs58 encoded multihash
* else if (Buffer)
*   if (1st byte is 0 or 1) -> CID
*   else -> multihash
* else if (Number)
*   -> construct CID by parts
* ```
*
* @param {string|Buffer|CID} version
* @param {string} [codec]
* @param {Buffer} [multihash]
* @param {string} [multibaseName]
*
* @example
* new CID(<version>, <codec>, <multihash>, <multibaseName>)
* new CID(<cidStr>)
* new CID(<cid.buffer>)
* new CID(<multihash>)
* new CID(<bs58 encoded multihash>)
* new CID(<cid>)
*/
```
