const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
const _ = require('lodash')

var antTerminal
var configOptions
var antHome
// var envVarsSettings
var antExecutable
var sortTargetsAlphabetically

var project

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
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
    this.refresh()
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
    if (element.contextValue === 'antFile') {
      return {
        id: element.filePath,
        contextValue: element.contextValue,
        label: element.fileName,
        command: '',
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        tooltip: element.filePath
      }
    } else if (element.contextValue === 'antTarget') {
      let treeItem = {
        id: element.name,
        label: element.name,
        command: 'vscode-ant.runAntTask',
        arguments: [element.name],
        contextValue: 'antTarget',
        tooltip: element.description
      }
      // can be expanded for depends?
      if (element.depends) {
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
      } else {
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None
      }
      if (element.name === project.$.default) {
        treeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'icons', 'light', 'default.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'icons', 'dark', 'default.svg')
        }
      } else {
        treeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'icons', 'light', 'target.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'icons', 'dark', 'target.svg')
        }
      }

      return treeItem
    } else if (element.contextValue === 'antDepends') {
      let treeItem = {
        label: element.name,
        command: 'vscode-ant.runAntDependency',
        arguments: [element.name],
        contextValue: 'antDepends',
        iconPath: {
          light: path.join(__filename, '..', '..', 'resources', 'icons', 'light', 'dependency.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'icons', 'dark', 'dependency.svg')
        }
      }
      // can be expanded for depends?
      if (element.depends) {
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
      } else {
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None
      }
      return treeItem
    } else {
      return element
    }
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
      // add root element?
      if (!element) {
        var buildXml = path.join(this.rootPath, 'build.xml')
        if (this.pathExists(buildXml)) {
          var root = {
            id: 'build.xml',
            contextValue: 'antFile',
            filePath: buildXml,
            fileName: 'build.xml'
          }
          resolve([root])
        } else {
          vscode.window.showInformationMessage('Workspace has no build.xml.')
          resolve([])
        }
      } else {
        if (element.contextValue === 'antFile' && element.filePath) {
          this.getTargetsInBuildXml(element.filePath)
            .then((targets) => {
              resolve(targets)
            })
            .catch((err) => {
              console.log(err)
              resolve([])
            })
        } else if (element.contextValue === 'antTarget' && element.depends) {
          this.getDependsInTarget(element)
            .then((depends) => {
              resolve(depends)
            })
            .catch((err) => {
              console.log(err)
              resolve([])
            })
        } else if (element.contextValue === 'antDepends' && element.depends) {
          this.getDependsInTarget(element)
            .then((depends) => {
              resolve(depends)
            })
            .catch((err) => {
              console.log(err)
              resolve([])
            })
        } else {
          resolve([])
          reject(new Error('Something went wrong!'))
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
          } else {
            vscode.window.showInformationMessage('Targets loaded from build.xml!')

            project = this.setParentValues(result.project)
            var targets = project.target.map((target) => {
              var antTarget = {
                id: target.$.name,
                contextValue: 'antTarget',
                depends: target.$.depends,
                name: target.$.name
              }
              return antTarget
            })

            resolve(this._sort(targets))
          }
        })
      })
    })
  }

  setParentValues (o) {
    if (o.target) {
      for (let n in o.target) {
        o.target[n].parent = o
        this.setParentValues(o.target[n])
      }
    }
    return o
  }

  getDependsInTarget (element) {
    return new Promise((resolve, reject) => {
      var depends = element.depends.split(',').map((depends) => {
        var dependsTarget = {
          id: depends,
          contextValue: 'antDepends',
          name: depends
        }
        // get details of this target
        var target = _.find(project.target, (o) => {
          if (o.$.name === depends && o.parent.target) {
            return true
          }
          return false
        })
        if (target) {
          dependsTarget.depends = target.$.depends
        }
        return dependsTarget
      })
      resolve(depends)
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

  runSelectedAntTarget (context) {
    console.log('wut?')
  }

  runAntTarget (context) {
    if (!context) {
      return
    }

    var target = context.name

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
      if (n1.name < n2.name) {
        return -1
      } else if (n1.name > n2.name) {
        return 1
      } else {
        return 0
      }
    })
  }

  terminalClosed (terminal) {
    if (terminal.name === antTerminal.name) {
      antTerminal = null
    }
  }
}
