const fileHelper = require('./fileHelper')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
const AntWrapper = require('./AntWrapper')

module.exports = class BuildFileParser {
  constructor (vscode, context, rootPath) {
    this.vscode = vscode
    this.rootPath = rootPath
    this._parser = new xml2js.Parser()
    // console.debug(this.rootPath)
    this.useAntToParse = true
    this.antWrapper = new AntWrapper(vscode, context, rootPath)
    this.getConfigOptions()
  }

  getConfigOptions () {
    let configOptions = this.vscode.workspace.getConfiguration('ant', null)

    this.useAntForParsing = configOptions.get('useAntForParsing', 'ant')
  }

  findBuildFile (searchDirectories, searchFileNames) {
    return new Promise(async (resolve, reject) => {
      try {
        var filename = await fileHelper.findFirstFile(this.rootPath, searchDirectories, searchFileNames)
        resolve(filename)
      } catch (error) {
        return reject(new Error('No build file found!'))
      }
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

  getImportTargets (antImportFile, existingTargets, existingSourceFiles) {
    return new Promise(async (resolve, reject) => {
      try {
        var importFileContents = await this.parseBuildFile(antImportFile)
      } catch (error) {
        return reject(new Error(`Error reading ${antImportFile}!: ` + error))
      }

      try {
        [existingTargets, existingSourceFiles] = await this.getTargets(antImportFile, importFileContents, existingTargets, existingSourceFiles)
      } catch (error) {
        return reject(error)
      }
      return resolve([existingTargets, existingSourceFiles])
    })
  }

  getTargets (fileName, fileContents, existingTargets, existingSourceFiles) {
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
            [existingTargets, existingSourceFiles] = await this.getImportTargets(path.join(path.dirname(fileName), antImport.file), existingTargets, existingSourceFiles)
          } catch (error) {
            return reject(new Error(`Error importing ${antImport}!: ` + error))
          }
        }
      }

      // get targets from the project
      var targets = []
      if (fileContents.project.target) {
        targets = fileContents.project.target.map((target) => {
          var antTarget = {
            id: target.$.name,
            contextValue: 'antTarget',
            depends: target.$.depends,
            name: target.$.name
          }

          // set source file name
          if (target.$.sourceFile) {
            antTarget.sourceFile = path.relative(this.rootPath, target.$.sourceFile)
          } else {
            antTarget.sourceFile = fileName
          }

          if (target.$.description) {
            antTarget.description = target.$.description
          } else {
            antTarget.description = target.$.name
          }

          return antTarget
        })
      }
      return resolve([existingTargets.concat(targets), existingSourceFiles.concat(fileName)])
    })
  }

  async parseBuildFile (buildFileName) {
    try {
      if (this.useAntForParsing) {
        return await this.parseBuildFileWithAnt(buildFileName)
      } else {
        return await this.parseBuildFileDirect(buildFileName)
      }
    } catch (err) {
      throw err
    }
  }

  async parseBuildFileWithAnt (buildFileName) {
    try {
      const data = await this.antWrapper.spawnAnt(buildFileName)
      return this.antWrapper.parseAntData(data)
    } catch(err) {
      console.error(err)
    }
  }

  parseBuildFileDirect (buildFileName) {
    // console.debug(`buildFileName= ${buildFileName}`)
    return new Promise((resolve, reject) => {
      var buildXml = fileHelper.getRootFile(this.rootPath, buildFileName)
      if (fileHelper.pathExists(buildXml)) {
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
