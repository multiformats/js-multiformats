import * as Block from 'multiformats/block'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

const main = async (): Promise<void> => {
  const block = await Block.encode({
    value: { hello: 'world' },
    hasher: sha256,
    codec: json
  })

  /* eslint-disable no-console */
  console.log(block)
}

export default main
