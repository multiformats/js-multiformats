import { readdirSync } from 'fs'
import { join } from 'path'
import alias from '@rollup/plugin-alias';

const dir = 'dist'
const preserveModules = true
const plugins = [
  alias({ entries: [ { find: 'multiformats', replacement: process.cwd() } ] })
]

const output = { dir, preserveModules, format: 'cjs', entryFileNames: '[name].cjs' }
const testdir = join(__dirname, 'test')
const filter = name => name.endsWith('.js')
const createConfig = f => ({ input: join('test', f), output, plugins })
const configs = readdirSync(testdir).filter(filter).map(createConfig)

console.log(configs)

export default configs
