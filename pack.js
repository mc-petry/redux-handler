const fs = require('fs')

const package = JSON.parse(fs.readFileSync('package.json'))
package.types = "index.d.ts"

fs.writeFileSync('dist/package.json', JSON.stringify(package))