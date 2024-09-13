import { from } from './base.js'

const alphabet = Array.from('🚀🪐☄🛰🌌🌑🌒🌓🌔🌕🌖🌗🌘🌍🌏🌎🐉☀💻🖥💾💿😂❤😍🤣😊🙏💕😭😘👍😅👏😁🔥🥰💔💖💙😢🤔😆🙄💪😉☺👌🤗💜😔😎😇🌹🤦🎉💞✌✨🤷😱😌🌸🙌😋💗💚😏💛🙂💓🤩😄😀🖤😃💯🙈👇🎶😒🤭❣😜💋👀😪😑💥🙋😞😩😡🤪👊🥳😥🤤👉💃😳✋😚😝😴🌟😬🙃🍀🌷😻😓⭐✅🥺🌈😈🤘💦✔😣🏃💐☹🎊💘😠☝😕🌺🎂🌻😐🖕💝🙊😹🗣💫💀👑🎵🤞😛🔴😤🌼😫⚽🤙☕🏆🤫👈😮🙆🍻🍃🐶💁😲🌿🧡🎁⚡🌞🎈❌✊👋😰🤨😶🤝🚶💰🍓💢🤟🙁🚨💨🤬✈🎀🍺🤓😙💟🌱😖👶🥴▶➡❓💎💸⬇😨🌚🦋😷🕺⚠🙅😟😵👎🤲🤠🤧📌🔵💅🧐🐾🍒😗🤑🌊🤯🐷☎💧😯💆👆🎤🙇🍑❄🌴💣🐸💌📍🥀🤢👅💡💩👐📸👻🤐🤮🎼🥵🚩🍎🍊👼💍📣🥂')
const alphabetBytesToChars: string[] = (alphabet.reduce<string[]>((p, c, i) => { p[i] = c; return p }, ([])))
const alphabetCharsToBytes: number[] = (alphabet.reduce<number[]>((p, c, i) => {
  const codePoint = c.codePointAt(0)
  if (codePoint == null) {
    throw new Error(`Invalid character: ${c}`)
  }
  p[codePoint] = i
  return p
}, ([])))

function encode (data: Uint8Array): string {
  return data.reduce((p, c) => {
    p += alphabetBytesToChars[c]
    return p
  }, '')
}

function decode (str: string): Uint8Array {
  const byts = []
  for (const char of str) {
    const codePoint = char.codePointAt(0)
    if (codePoint == null) {
      throw new Error(`Invalid character: ${char}`)
    }
    const byt = alphabetCharsToBytes[codePoint]
    if (byt == null) {
      throw new Error(`Non-base256emoji character: ${char}`)
    }
    byts.push(byt)
  }
  return new Uint8Array(byts)
}

export const base256emoji = from({
  prefix: '🚀',
  name: 'base256emoji',
  encode,
  decode
})
