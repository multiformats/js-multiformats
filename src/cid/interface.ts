import { ByteView, Link, MultihashDigest, Version } from '../link/interface.js'

/**
 * A content identifier that contains a version, a codec and a
 * multihash.
 *
 * @template Data - Logical type of the data being linked to.
 * @template Format - multicodec code corresponding to a codec linked data is encoded with
 * @template Alg - multicodec code corresponding to the hashing algorithm of the CID
 * @template Ver - CID version
 */
export interface CID<
Data extends unknown = unknown,
Format extends number = number,
Alg extends number = number,
Ver extends Version = Version
> {
  version: Ver
  code: Format
  multihash: MultihashDigest<Alg>
  bytes: ByteView<Link<Data, Format, Alg, Ver>>
}
