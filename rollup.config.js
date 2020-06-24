import { readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json')))

const relativeToMain = name => ({
  name: 'relative-to-main',
  renderChunk: source => {
    const lines = source.split('\n')
    source = ''
    for (let line of lines) {
      if (line.includes("require('../index.cjs')")) {
        line = line.replace("require('../index.cjs')", `require('${name}')`)
      }
      if (line.includes("require('../")) {
        line = line.replace("require('../", `require('${name}/`)
        line = line.replace('.cjs', '.js')
      }
      source += line + '\n'
    }
    return source
  }
})

const plugins = [relativeToMain(pkg.name)]
const dir = 'dist'
const preserveModules = true
const output = { dir, preserveModules, plugins, format: 'cjs', entryFileNames: '[name].cjs' }
const testdir = join(__dirname, 'test')
const filter = name => name.startsWith('test-')
const createConfig = f => ({ input: join('test', f), output })

const configs = readdirSync(testdir).filter(filter).map(createConfig)

console.log(configs)

export default configs
