const fs = require('fs-extra')

const distFolder = 'dist'

const package = JSON.parse(fs.readFileSync('package.json'))
package.types = "index.d.ts"

fs.writeFileSync(`${distFolder}/package.json`, JSON.stringify(package))

const filesToCopy = [
  'LICENSE',
  'package-lock.json',
  'README.md',
  'src'
]

filesToCopy.forEach(file => {
  fs.copySync(file, `${distFolder}/${file}`)
})