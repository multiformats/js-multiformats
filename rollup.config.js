import { readdirSync } from 'fs'
import { join } from 'path'

const dir = 'dist'
const preserveModules = true
const configs = []
for (const subdir of ['test', 'bases', 'hashes', 'codecs', '.']) {
  const output = { dir: join(dir, subdir), preserveModules, format: 'cjs', entryFileNames: '[name].cjs' }
  const testdir = join(__dirname, subdir)
  const filter = name => name.endsWith('.js')
  const createConfig = f => ({ input: join(subdir, f), output })
  readdirSync(testdir).filter(filter).map(createConfig).forEach(c => configs.push(c))
}
console.log(configs)

export default configs
