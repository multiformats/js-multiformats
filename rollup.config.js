import { readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json')))

const relativeToMain = name => ({
  name: 'relative-to-main',
  renderChunk: source => {
    while (source.includes("require('../index.js')")) {
      source = source.replace("require('../index.js')", `require('${name}')`)
    }
    while (source.includes("require('../')")) {
      source = source.replace("require('../", `require('${name}/`)
    }
    return source
  }
})

const plugins = [relativeToMain(pkg.name)]
const dir = 'dist'
const output = { dir, plugins, format: 'cjs', entryFileNames: '[name].cjs' }
const testdir = join(__dirname, 'test')
const filter = name => name.startsWith('test-')
const createConfig = f => ({ input: join('test', f), output })

const configs = readdirSync(testdir).filter(filter).map(createConfig)

console.log(configs)

export default configs
