const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

var antTerminal
var configOptions
var antHome
// var envVarsSettings
var antExecutable
var sortTargetsAlphabetically

module.exports = class AntRunnerViewProvider {
  constructor (context) {
    var workspaceFolders = vscode.workspace.workspaceFolders
    this.rootPath = workspaceFolders[0].uri.fsPath

    var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.rootPath, 'build.xml'))
    context.subscriptions.push(fileSystemWatcher)

    fileSystemWatcher.onDidChange(() => {
      this._onDidChangeTreeData.fire()
    })
    fileSystemWatcher.onDidDelete(() => {
      this._onDidChangeTreeData.fire()
    })
    fileSystemWatcher.onDidCreate(() => {
      this._onDidChangeTreeData.fire()
    })

    this._parser = new xml2js.Parser()

    this._onDidChangeTreeData = new vscode.EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event

    this.getConfigOptions()
    vscode.workspace.onDidChangeConfiguration(() => {
      this.getConfigOptions()
      this.refresh()
    })
  }

  getConfigOptions () {
    configOptions = vscode.workspace.getConfiguration('ant')
    antHome = configOptions.get('home', '')
    // envVarsSettings = configOptions.get('envVars', 'DLC=C:\\Progress\\OpenEdge')
    antExecutable = configOptions.get('executable', 'ant')
    sortTargetsAlphabetically = configOptions.get('sortTargetsAlphabetically', 'true')
  }

  refresh () {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem (element) {
    return element
  }

  getChildren (element) {
    if (!this.rootPath) {
      vscode.window.showInformationMessage('No build.xml in empty workspace.')
      return new Promise((resolve, reject) => {
        resolve([])
        reject(new Error('Failed somehow'))
      })
    }

    return new Promise((resolve, reject) => {
      if (element) {
        resolve([])
        reject(new Error('It is empty!'))
      } else {
        const buildXml = path.join(this.rootPath, 'build.xml')
        if (this.pathExists(buildXml)) {
          this.getTargetsInBuildXml(buildXml)
            .then((targets) => {
              resolve(targets)
            })
            .catch((err) => {
              // reject(new Error(err))
              console.log(err)
              resolve([])
            })
        } else {
          vscode.window.showInformationMessage('Workspace has no build.xml.')
          resolve([])
        }
      }
    })
  }

  getTargetsInBuildXml (buildXml) {
    return new Promise((resolve, reject) => {
      fs.readFile(buildXml, 'utf-8', (err, data) => {
        if (err) {
          vscode.window.showInformationMessage('Error reading build.xml!')
          reject(new Error('Error reading build.xml!: ' + err))
        }
        this._parser.parseString(data, (err, result) => {
          if (err) {
            vscode.window.showInformationMessage('Error parsing build.xml!')
            reject(new Error('Error parsing build.xml!:' + err))
          }
          vscode.window.showInformationMessage('Targets loaded from build.xml!')

          var targets = result.project.target.map((target) => {
            return {
              label: target.$.name,
              collapsibleState: vscode.TreeItemCollapsibleState.None,
              command: 'vscode-ant.runAntTask',
              contextValue: 'antTarget',
              iconPath: false,
              depends: target.$.depends,
              targetName: target.$.name
            }
          })

          resolve(this._sort(targets))
        })
      })
    })
  }

  pathExists (p) {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }

    return true
  }

  runAntTarget (context) {
    if (!context) {
      return
    }

    var target = context.targetName

    if (!antTerminal) {
      var envVars = {}
      if (antHome) {
        envVars.ANT_HOME = antHome
      }

      antTerminal = vscode.window.createTerminal({ name: 'Ant Target Runner', env: envVars })
    }

    antTerminal.sendText(`${antExecutable} ${target}`)
    antTerminal.show()
  }

  _sort (nodes) {
    if (!sortTargetsAlphabetically) {
      return nodes
    }

    return nodes.sort((n1, n2) => {
      if (n1.label < n2.label) {
        return -1
      } else if (n1.label > n2.label) {
        return 1
      } else {
        return 0
      }
    })
  }

  terminalClosed (terminal) {
    if (terminal._id === antTerminal._id) {
      antTerminal = null
    }
  }
}
