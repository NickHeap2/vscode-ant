const filehelper = require('./filehelper')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

module.exports = class AntTreeDataProvider {
  constructor (rootPath) {
    this.rootPath = rootPath
    this._parser = new xml2js.Parser()
    console.debug(this.rootPath)
  }

  findBuildFile (searchDirectories, searchFileNames) {
    return new Promise((resolve, reject) => {
      for (const searchDirectory of searchDirectories) {
        for (const searchFileName of searchFileNames) {
          const searchFile = path.join(searchDirectory, searchFileName)
          const searchPath = path.join(this.rootPath, searchFile)
          if (filehelper.pathExists(searchPath)) {
            return resolve(searchFile)
          }
        }
      }
      return reject(new Error('No build file found!'))
    })
  }

  getProjectDetails (buildFileObj) {
    var project = {
      name: '',
      default: ''
    }
    if (!buildFileObj.project) {
      return project
    }

    if (buildFileObj.project.$.name) {
      project.name = buildFileObj.project.$.name
    }

    if (buildFileObj.project.$.default) {
      project.default = buildFileObj.project.$.default
    }

    return project
  }

  getImportTargets (antImportFile, existingTargets) {
    return new Promise(async (resolve, reject) => {
      try {
        var importFileContents = await this.parseBuildFile(antImportFile)
      } catch (error) {
        return reject(new Error(`Error reading ${antImportFile}!: ` + error))
      }

      try {
        existingTargets = await this.getTargets(antImportFile, importFileContents, existingTargets)
      } catch (error) {
        return reject(error)
      }
      return resolve(existingTargets)
    })
  }

  getTargets (fileName, fileContents, existingTargets) {
    return new Promise(async (resolve, reject) => {
      // get imports
      if (fileContents.project.import) {
        var antImports = fileContents.project.import.map((theImport) => {
          let antImport = {
            file: theImport.$.file
          }
          return antImport
        })
        for (const antImport of antImports) {
          try {
            existingTargets = await this.getImportTargets(path.join(path.dirname(fileName), antImport.file), existingTargets)
          } catch (error) {
            return reject(new Error(`Error importing ${antImport}!: ` + error))
          }
          // existingTargets = existingTargets.concat(importTargets)
        }
      }

      // get targets from the project
      var targets = fileContents.project.target.map((target) => {
        var antTarget = {
          id: target.$.name,
          contextValue: 'antTarget',
          depends: target.$.depends,
          name: target.$.name
        }
        return antTarget
      })
      return resolve(existingTargets.concat(targets))
    })
  }

  parseBuildFile (buildFileName) {
    console.debug(`buildFileName= ${buildFileName}`)
    return new Promise((resolve, reject) => {
      var buildXml = filehelper.getRootFile(this.rootPath, buildFileName)
      if (filehelper.pathExists(buildXml)) {
        fs.readFile(buildXml, 'utf-8', (err, data) => {
          if (err) {
            return reject(new Error('Error reading build.xml!: ' + err))
          }
          // resolve(data)
          this._parser.parseString(data, (err, result) => {
            if (err) {
              return reject(new Error('Error parsing build.xml!:' + err))
            } else {
              return resolve(result)
              // project = this.setParentValues(result.project)

              // var root = {
              //   id: 'build.xml',
              //   contextValue: 'antFile',
              //   filePath: buildXml,
              //   fileName: 'build.xml'
              // }
              // if (project.$.name) {
              //   root.project = project.$.name
              // }

              // resolve([root])
            }
          })
        })
      } else {
        return reject(new Error(`${buildXml} was not found!`))
      }
    })
  }
}
