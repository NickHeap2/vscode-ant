const filehelper = require('./filehelper')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

module.exports = class BuildFileParser {
  constructor (rootPath) {
    this.rootPath = rootPath
    this._parser = new xml2js.Parser()
    console.debug(this.rootPath)
    this.useAntToParse = true
  }

  findBuildFile (searchDirectories, searchFileNames) {
    return new Promise(async (resolve, reject) => {
      try {
        var filename = await filehelper.findFirstFile(this.rootPath, searchDirectories, searchFileNames)
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
            sourceFile: fileName,
            depends: target.$.depends,
            name: target.$.name
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

  async parseBuildFileWithAnt (buildFileName) {
    try {
      const data = await this.spawnAnt(buildFileName)
      const buildFile = await this.parseAntData(data)
    } catch(err) {
      console.error(err)
    }
    // data=> {parseData(data)},
    // err=>  {console.error("async error:\n" + err)}
    // )
  }

  async parseAntData (data) {
    const buildFileObj = {
      project: {
        $: {
          name: '',
          default: ''
        }
      }
    }

    let currentFile = {
      name: '',
      path: ''
    }
    let currentTarget = {}
    let mainTargetsMode = false
    let otherTargetsMode = false

    const lineData = data.replace(/\r/g, '')
    const lines = lineData.split('\n')

    for (const line of lines) {
      console.log(line)
      if (line.match(/ant\.file\.(?!type)/)) {
        let lineParts = line.split('ant.file.')
        if (lineParts.length > 1) {
          lineParts = lineParts[1].split(' -> ')
          if (lineParts.length > 1) {
            currentFile.name = lineParts[0]
            currentFile.path = lineParts[1]
          }
        }
      }

      if (line.match(/\+Target/)) {
        const lineParts = line.split('+Target: ')
        if (lineParts.length > 1) {
          const targetName = lineParts[1]
          if (targetName !== '' && !targetName.startsWith(currentFile.name)) {
            buildFileObj.project.$.targets.push({ name: targetName, sourceFile: currentFile.path })
          }
        }
      }

      if (line.match(/ant.project.name/)) {
        const lineParts = line.split(' -> ')
        if (lineParts.length > 1) {
          buildFileObj.project.$.name = lineParts[1]
        }
      }

      if (line.match(/ant.project.default-target/)) {
        const lineParts = line.split(' -> ')
        if (lineParts.length > 1) {
          buildFileObj.project.$.default = lineParts[1]
        }
      }

      if (line.match(/^Main targets:/)) {
        mainTargetsMode = true
        continue
      }
      if (line.match(/^Other targets:/)) {
        mainTargetsMode = false
        otherTargetsMode = true
        continue
      }

      if (mainTargetsMode || otherTargetsMode) {
        if (line.match(/^ {3}depends on:/)) {
          const lineParts = line.split(' depends on: ')
          if (lineParts.length > 1) {
            currentTarget.depends = lineParts[1]
          }
        }

        // entry is space then target name then two spaces then description
        for(const target of buildFileObj.project.$.targets) {
          const regex = new RegExp(`^( ${target.name})`)
          const match = line.match(regex)
          // first we must match target name
          if (match && match.length > 0) {
            const firstMatch = match[0]
            const matchLength = firstMatch.length

            // if the line length is equal to matchLength there is no description
            if (line.length === matchLength) {
              currentTarget = target
              continue
            }

            // the text after the match must start with 2 spaces otherwise we are probably matching the wrong target
            if (line.length < matchLength + 2 || line[matchLength] !== ' ' || line[matchLength + 1] !== ' ') {
              continue
            }
            currentTarget = target
            currentTarget.description = line.substring(matchLength + 2).trimStart()
          }
        }
      }
    }

    return buildFileObj
  }

  async spawnAnt (buildFileName) {
    const { spawn } = require('child_process');
    const child = spawn('S:/Workspaces/vscode-ant/apache-ant/bin/ant.bat', ['-p', '-v', '-d', '-buildfile', buildFileName], { shell: true })

    let data = ""
    for await (const chunk of child.stdout) {
        data += chunk
    }
    let error = ""
    for await (const chunk of child.stderr) {
        error += chunk
    }
    const exitCode = await new Promise( (resolve, reject) => {
        child.on('close', resolve)
    })

    if( exitCode) {
        throw new Error( `subprocess error exit ${exitCode}, ${error}`);
    }
    return data
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
