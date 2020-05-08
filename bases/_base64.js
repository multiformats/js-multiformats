const { coerce } = require('../bytes')
exports.encode = o => Buffer.from(o).toString('base64')
exports.decode = s => coerce(Buffer.from(s, 'base64'))
