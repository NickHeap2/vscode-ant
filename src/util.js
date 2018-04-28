const fs = require('fs')
const path = require('path')

function pathExists (p) {
  try {
    fs.accessSync(p)
  } catch (err) {
    return false
  }

  return true
}
exports.pathExists = pathExists

function getRootFile (root, f) {
  return path.join(root, f)
}
exports.getRootFile = getRootFile
