const fs = require('fs')
const path = require('path')

function findfirstFile (rootPath, searchDirectories, searchFileNames) {
  return new Promise((resolve, reject) => {
    for (const searchDirectory of searchDirectories) {
      for (const searchFileName of searchFileNames) {
        const searchFile = path.join(searchDirectory, searchFileName)
        const searchPath = path.join(rootPath, searchFile)
        if (pathExists(searchPath)) {
          return resolve(searchFile)
        }
      }
    }
    return reject(new Error('No file found!'))
  })
}
exports.findfirstFile = findfirstFile

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
