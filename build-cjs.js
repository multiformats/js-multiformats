import fs from 'node:fs'
import esbuild from 'esbuild'

let packageJson = fs.readFileSync('./package.json', 'utf8')
packageJson = JSON.parse(packageJson)

const entryPoints = []

// eslint-disable-next-line guard-for-in
for (const exportName in packageJson.exports) {
  const { import: importPath } = packageJson.exports[exportName]
  entryPoints.push(importPath)
}

esbuild.build({
  entryPoints: entryPoints,
  bundle: true,
  packages: 'external',
  format: 'cjs',
  sourcemap: true,
  platform: 'node',
  outdir: './dist/cjs',
  allowOverwrite: true
})
