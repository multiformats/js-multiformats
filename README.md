# WIP

Most of what is documented below is not yet implemented.

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
const multiformats = require('multiformats')()
const sha2 = require('@multiformats/sha2')
const dagcbor = require('@ipld/dag-cbor')
multiformats.multihash.add(sha2)
multiformats.multicodec.add(dagcbor)
const Block = require('@ipld/block/bare')(multiformats)
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
