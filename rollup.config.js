import globby from 'globby'
import path from 'path'

let configs = []

const _filter = p => !p.includes('/_') && !p.includes('rollup.config')

const relativeToMain = name => ({
  name: 'relative-to-main',
  renderChunk: source => {
    while (source.includes("require('../index.js')")) {
      source = source.replace("require('../index.js')", "require('multiformats')")
    }
    while (source.includes("require('../")) {
      source = source.replace('require(\'../', 'require(\'multiformats/')
    }
    return source
  }
})

const plugins = [relativeToMain('multiformats')]
const add = (pattern) => {
  configs = configs.concat(globby.sync(pattern).filter(_filter).map(inputFile => ({
    input: inputFile,
    output: {
      plugins: pattern.startsWith('test') ? plugins : null,
      file: path.join('dist', inputFile).replace('.js', '.cjs'),
      format: 'cjs'
    }
  })))
}
add('*.js')
add('bases/*.js')
add('hashes/*.js')
add('codecs/*.js')
add('test/*.js')
add('test/fixtures/*.js')
console.log(configs)

export default configs
