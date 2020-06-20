import globby from 'globby'
import path from 'path'

let configs = []

const _filter = p => !p.includes('/_') && !p.includes('rollup.config')

const add = pattern => {
  configs = configs.concat(globby.sync(pattern).filter(_filter).map(inputFile => ({
    input: inputFile,
    output: {
      file: path.join('dist', inputFile).replace('.js', '.cjs'),
      format: 'cjs'
    }
  })))
}
add('*.js')
add('bases/*.js')
add('hashes/*.js')
add('codecs/*.js')
console.log({ configs })

export default configs
