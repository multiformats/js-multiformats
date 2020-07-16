import { readdirSync } from 'fs'
import { join } from 'path'

const dir = 'dist'
const preserveModules = true
const output = { dir, preserveModules, format: 'cjs', entryFileNames: '[name].cjs' }
const testdir = join(__dirname, 'test')
const filter = name => name.startsWith('test-')
const createConfig = f => ({ input: join('test', f), output })

const configs = readdirSync(testdir).filter(filter).map(createConfig)

console.log(configs)

export default configs
