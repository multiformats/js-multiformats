// @ts-check

import { keccak256 as web3Keccak } from 'web3-utils'
import {from} from "./hasher";
import {coerce} from "../bytes";

export const keccak256 = from({
    name: 'keccak-256',
    code: 0x1b,
    encode: (input) => coerce(Uint8Array.from(Buffer.from(web3Keccak(Buffer.from(input).toString('hex')), 'hex')))
})
