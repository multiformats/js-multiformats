module.exports = b => btoa([].reduce.call(b, (p,c) => p + String.fromCharCode(c),''))
