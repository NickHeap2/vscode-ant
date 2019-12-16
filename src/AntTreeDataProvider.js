const vscode = require('vscode')
const _ = require('lodash')
const filehelper = require('./filehelper')
const path = require('path')
const BuildFileParser = require('./BuildFileParser.js')

var configOptions

// var extensionContext
var selectedAntTarget

module.exports = class AntTreeDataProvider {
  constructor (context) {
    this.extensionContext = context

    this.targetRunner = null
    this.targets = null
    this.project = null
    this.buildFilenames = 'build.xml'
    this.buildFileDirectories = '.'
    this.fileSystemWatchers = []

    var workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      this.rootPath = workspaceFolders[0].uri.fsPath
      // this.watchBuildXml(workspaceFolders)
      this.BuildFileParser = new BuildFileParser(workspaceFolders[0].uri.fsPath)
    }

    // event for notify of change of data
    this._onDidChangeTreeData = new vscode.EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event

    // trap config and workspaces changes to pass updates
    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeConfiguration)

    var onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeWorkspaceFolders)

    this.getConfigOptions()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
    this.refresh()
  }

  onDidChangeWorkspaceFolders () {
    var workspaceFolders = vscode.workspace.workspaceFolders

    if (workspaceFolders) {
      this.rootPath = workspaceFolders[0].uri.fsPath
      this.BuildFileParser = new BuildFileParser(workspaceFolders[0].uri.fsPath)
    }

    this.refresh()
  }

  watchBuildFile (buildFileName) {
    var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(filehelper.getRootFile(this.rootPath, buildFileName))
    this.extensionContext.subscriptions.push(fileSystemWatcher)

    fileSystemWatcher.onDidChange(() => {
      this._onDidChangeTreeData.fire()
    }, this, this.extensionContext.subscriptions)
    fileSystemWatcher.onDidDelete(() => {
      this._onDidChangeTreeData.fire()
    }, this, this.extensionContext.subscriptions)
    fileSystemWatcher.onDidCreate(() => {
      this._onDidChangeTreeData.fire()
    }, this, this.extensionContext.subscriptions)

    this.fileSystemWatchers.push(fileSystemWatcher)
  }

  // watchBuildXml (workspaceFolders) {
  //   this.rootPath = workspaceFolders[0].uri.fsPath

  //   // var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(filehelper.getRootFile(this.rootPath, 'build.xml'))
  //   // extensionContext.subscriptions.push(fileSystemWatcher)

  //   // fileSystemWatcher.onDidChange(() => {
  //   //   this._onDidChangeTreeData.fire()
  //   // }, this, extensionContext.subscriptions)
  //   // fileSystemWatcher.onDidDelete(() => {
  //   //   this._onDidChangeTreeData.fire()
  //   // }, this, extensionContext.subscriptions)
  //   // fileSystemWatcher.onDidCreate(() => {
  //   //   this._onDidChangeTreeData.fire()
  //   // }, this, extensionContext.subscriptions)
  // }

  getConfigOptions () {
    configOptions = vscode.workspace.getConfiguration('ant', null)
    this.sortTargetsAlphabetically = configOptions.get('sortTargetsAlphabetically', 'true')
    this.buildFilenames = configOptions.get('buildFilenames', 'build.xml')
    if (this.buildFilenames === '' || typeof this.buildFilenames === 'undefined') {
      this.buildFilenames = 'build.xml'
    }
    this.buildFileDirectories = configOptions.get('buildFileDirectories', '.')
    if (this.buildFileDirectories === '' || typeof this.buildFileDirectories === 'undefined') {
      this.buildFileDirectories = '.'
    }
  }

  refresh () {
    // remove subscriptions
    for (const fileSystemWatcher of this.fileSystemWatchers) {
      this.extensionContext.subscriptions.splice(this.extensionContext.subscriptions.indexOf(fileSystemWatcher), 1)
      fileSystemWatcher.dispose()
    }
    this.fileSystemWatchers = []

    this._onDidChangeTreeData.fire()
  }

  getTreeItem (element) {
    if (element.contextValue === 'antFile') {
      let treeItem = {
        id: element.filePath,
        contextValue: element.contextValue,
        label: element.fileName,
        command: '',
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        tooltip: element.filePath
      }
      if (element.project) {
        treeItem.label = `${element.fileName}    (${element.project})`
      }
      return treeItem
    } else if (element.contextValue === 'antTarget') {
      let treeItem = {
        id: element.name,
        label: element.name,
        command: {
          arguments: [element.name],
          command: 'vscode-ant.selectedAntTarget',
          title: 'selectedAntTarget'
        },
        contextValue: 'antTarget',
        tooltip: `${element.description} (${element.sourceFile})`
      }
      // can be expanded for depends?
      if (element.depends) {
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
      } else {
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None
      }
      if (element.name === this.project.default) {
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
        command: {
          arguments: [element.name],
          command: 'vscode-ant.selectedAntTarget',
          title: 'selectedAntTarget'
        },
        contextValue: 'antDepends',
        tooltip: `${element.description} (${element.sourceFile})`,
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
        this.getRoots()
          .then((roots) => {
            resolve(roots)
          })
          .catch((err) => {
            console.log(err)
            resolve([])
          })
      } else {
        if (element.contextValue === 'antFile' && element.filePath) {
          this.getTargetsInProject()
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

  getRoots (varnew) {
    return new Promise(async (resolve, reject) => {
      try {
        var buildFilename = await this.BuildFileParser.findBuildFile(this.buildFileDirectories.split(','), this.buildFilenames.split(','))
      } catch (error) {
        vscode.window.showInformationMessage('Workspace has no build.xml files.')
        return resolve([])
      }

      try {
        var buildFileObj = await this.BuildFileParser.parseBuildFile(buildFilename)
      } catch (error) {
        vscode.window.showErrorMessage('Error reading build.xml!')
        return reject(new Error('Error reading build.xml!: ' + error))
      }

      try {
        var projectDetails = await this.BuildFileParser.getProjectDetails(buildFileObj)
        var buildTargets = await this.BuildFileParser.getTargets(buildFilename, buildFileObj, [])

        vscode.window.showInformationMessage('Targets loaded from build.xml!')

        const buildSourceFiles = _.uniq(_.map(buildTargets, 'sourceFile'))
        for (const buildSourceFile of buildSourceFiles) {
          this.watchBuildFile(buildSourceFile)
        }

        var root = {
          id: buildFilename,
          contextValue: 'antFile',
          filePath: path.dirname(buildFilename),
          fileName: path.basename(buildFilename),
          project: projectDetails.name
        }

        this.project = projectDetails
        this.targets = buildTargets

        resolve([root])
      } catch (error) {
        vscode.window.showErrorMessage('Error parsing build.xml!')
        return reject(new Error('Error parsing build.xml!:' + error))
      }

      // var buildXml = filehelper.getRootFile(this.rootPath, 'build.xml')
      // if (filehelper.pathExists(buildXml)) {
      //   fs.readFile(buildXml, 'utf-8', (err, data) => {
      //     if (err) {
      //       vscode.window.showErrorMessage('Error reading build.xml!')
      //       reject(new Error('Error reading build.xml!: ' + err))
      //     }
      //     this._parser.parseString(data, (err, result) => {
      //       if (err) {
      //         vscode.window.showErrorMessage('Error parsing build.xml!')
      //         reject(new Error('Error parsing build.xml!:' + err))
      //       } else {
      //         vscode.window.showInformationMessage('Targets loaded from build.xml!')
      //         project = this.setParentValues(result.project)

      //         var root = {
      //           id: 'build.xml',
      //           contextValue: 'antFile',
      //           filePath: buildXml,
      //           fileName: 'build.xml'
      //         }
      //         if (project.$.name) {
      //           root.project = project.$.name
      //         }

      //         resolve([root])
      //       }
      //     })
      //   })
      // } else {
      //   vscode.window.showInformationMessage('Workspace has no build.xml.')
      //   resolve([])
      // }
    })
  }

  getTargetsInProject () {
    return new Promise((resolve, reject) => {
      // var targets = project.target.map((target) => {
      //   var antTarget = {
      //     id: target.$.name,
      //     contextValue: 'antTarget',
      //     depends: target.$.depends,
      //     name: target.$.name
      //   }
      //   return antTarget
      // })
      let targets = this.targets.map((target) => {
        var antTarget = {
          id: target.name,
          contextValue: 'antTarget',
          sourceFile: target.sourceFile,
          depends: target.depends,
          name: target.name
        }
        return antTarget
      })
      resolve(this._sort(targets))
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
        var target = _.find(this.targets, (o) => {
          if (o.name === depends) {
            return true
          }
          return false
        })
        if (target) {
          dependsTarget.depends = target.depends
          dependsTarget.sourceFile = target.sourceFile
        }
        return dependsTarget
      })
      resolve(depends)
    })
  }

  selectedAntTarget (target) {
    selectedAntTarget = target
  }

  runSelectedAntTarget () {
    if (selectedAntTarget && this.targetRunner) {
      var target = selectedAntTarget
      if (target.indexOf(' ') >= 0) {
        target = '"' + target + '"'
      }
      this.targetRunner.runAntTarget({name: target})
    }
  }

  _sort (nodes) {
    if (!this.sortTargetsAlphabetically) {
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
}
