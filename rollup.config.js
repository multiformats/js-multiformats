import { readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import alias from '@rollup/plugin-alias'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json')))

const dir = 'dist'
const preserveModules = true
const plugins = [
  alias({ entries: [{ find: pkg.name, replacement: __dirname }] })
]

const output = { dir, preserveModules, format: 'cjs', entryFileNames: '[name].cjs' }
const testdir = join(__dirname, 'test')
const filter = name => name.endsWith('.js')
const createConfig = f => ({ input: join('test', f), output, plugins })
const configs = readdirSync(testdir).filter(filter).map(createConfig)

console.log(configs)

export default configs
