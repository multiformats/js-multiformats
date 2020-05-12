/* globals btoa, atob */
exports.encode = b => btoa([].reduce.call(b, (p, c) => p + String.fromCharCode(c), ''))
exports.decode = str => Uint8Array.from(atob(str), c => c.charCodeAt(0))
