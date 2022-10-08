const path = require('path')
const fileHelper = require('./fileHelper')

module.exports = class AntWrapper {
  constructor (vscode, context, rootPath) {
    this.vscode = vscode
    this.extensionContext = context
    this.rootPath = rootPath

    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeConfiguration)

    this.getConfigOptions()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  async getConfigOptions () {
    let configOptions = this.vscode.workspace.getConfiguration('ant', null)

    this.antHome = configOptions.get('home', '')
    if (this.antHome === '' || typeof this.antHome === 'undefined') {
      this.antHome = path.join(this.extensionContext.extensionPath, 'dist', 'apache-ant')
    }
    
    this.antExecutable = configOptions.get('executable', 'ant')
    if (this.antExecutable === '' || typeof this.antExecutable === 'undefined') {
      if (process.platform === 'win32') {
        this.antExecutable = 'ant.bat'
      } else {
        this.antExecutable = 'ant.sh'
      }
    }
  }

  parseAntData (data) {
    const buildFileObj = {
      project: {
        $: {
          name: '',
          default: ''
        },
        target: []
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
      // console.log(line)
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
          if (targetName !== '' && (currentFile.name === '' || !targetName.startsWith(currentFile.name + '.'))) {
            buildFileObj.project.target.push({
              $: {
                name: targetName,
                sourceFile: currentFile.path
              }
            })
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
            currentTarget.$.depends = lineParts[1]
          }
        }

        // entry is space then target name then two spaces then description
        for(const target of buildFileObj.project.target) {
          const regex = new RegExp(`^( ${target.$.name})`)
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
            currentTarget.$.description = line.substring(matchLength + 2).trimStart()
          }
        }
      }
    }

    return buildFileObj
  }

  async spawnAnt (buildFileName) {
    const { spawn } = require('child_process');

    let resolvedAntExecutable
    if (fileHelper.pathExists(this.antExecutable)) {
      resolvedAntExecutable = this.antExecutable
    } else if (fileHelper.pathExists(this.antHome)) {
      const joinedPath = path.join(this.antHome, 'bin')
      if (fileHelper.pathExists(joinedPath)) {
        resolvedAntExecutable = path.join(joinedPath, 'ant')
      }
    }

    if (!resolvedAntExecutable) {
      throw new Error( `Couldn't resolve ant executable from ${this.antExecutable} and ${this.antHome}!`);
    }

    const child = spawn(resolvedAntExecutable,
      ['-p', '-v', '-d', '-buildfile', buildFileName],
      {
        shell: true,
        cwd: this.rootPath
    })

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
        throw new Error( `subprocess error exit ${exitCode}, ${error}`)
    }
    return data
  }
}
