export default {
  encode: obj => new TextEncoder().encode(JSON.stringify(obj)),
  decode: buff => JSON.parse(new TextDecoder().decode(buff)),
  name: 'json',
  code: 0x0200
}
