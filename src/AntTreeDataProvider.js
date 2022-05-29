const vscode = require('vscode')
const _ = require('lodash')
const fileHelper = require('./fileHelper')
const path = require('path')
const BuildFileParser = require('./BuildFileParser.js')
const messageHelper = require('./messageHelper')

var darkDefault
var lightDefault
var darkTarget
var lightTarget
var darkDependency
var lightDependency

var configOptions
var selectedAntTarget

module.exports = class AntTreeDataProvider {
  constructor (context) {
    this.extensionContext = context

    darkTarget = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'resources', 'icons', 'dark', 'target.svg')
    )
    lightTarget = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'resources', 'icons', 'light', 'target.svg')
    )
    darkDefault = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'resources', 'icons', 'dark', 'default.svg')
    )
    lightDefault = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'resources', 'icons', 'light', 'default.svg')
    )
    darkDependency = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'resources', 'icons', 'dark', 'dependency.svg')
    )
    lightDependency = vscode.Uri.file(
      path.join(context.extensionPath, 'dist', 'resources', 'icons', 'light', 'dependency.svg')
    )

    this.targets = null
    this.project = null
    this.buildFilenames = 'build.xml'
    this.buildFileDirectories = '.'
    this.eventListeners = []

    this.workspaceFolders = vscode.workspace.workspaceFolders
    this.workspaceFolderNumber = 0
    if (this.workspaceFolders) {
      this.setWorkspaceFolder()
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

  setWorkspaceFolder () {
    this.rootPath = this.workspaceFolders[this.workspaceFolderNumber].uri.fsPath
    // this.watchBuildXml(workspaceFolders)
    this.BuildFileParser = new BuildFileParser(this.extensionContext, this.workspaceFolders[this.workspaceFolderNumber].uri.fsPath)

    vscode.commands.executeCommand('vscode-ant.setRunnerWorkspaceFolder', this.workspaceFolders[this.workspaceFolderNumber])
    vscode.commands.executeCommand('vscode-ant.setAutoWorkspaceFolder', this.workspaceFolders[this.workspaceFolderNumber])
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
    this.refresh()
  }

  onDidChangeWorkspaceFolders () {
    this.workspaceFolders = vscode.workspace.workspaceFolders
    this.workspaceFolderNumber = 0
    if (this.workspaceFolders) {
      this.setWorkspaceFolder()
    }

    this.refresh()
  }

  watchBuildFile (rootPath, buildFileName) {
    const buildFile = fileHelper.getRootFile(this.rootPath, buildFileName)
    this.watchFile(buildFile)
  }

  watchFile (globPattern) {
    var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(globPattern)
    this.extensionContext.subscriptions.push(fileSystemWatcher)

    this.eventListeners.push({
      filename: globPattern,
      fileSystemWatcher: fileSystemWatcher,
      didChangeListener: fileSystemWatcher.onDidChange(() => {
        this.refresh()
      }, this, this.extensionContext.subscriptions),
      didDeleteListener: fileSystemWatcher.onDidDelete(() => {
        this.refresh()
      }, this, this.extensionContext.subscriptions),
      didCreateListener: fileSystemWatcher.onDidCreate(() => {
        this.refresh()
      }, this, this.extensionContext.subscriptions)
    })
  }

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

  removeSubscription (item) {
    this.extensionContext.subscriptions.splice(this.extensionContext.subscriptions.indexOf(item), 1)
  }

  refresh () {
    // remove event listeners
    for (const eventListener of this.eventListeners) {
      eventListener.didChangeListener.dispose()
      eventListener.didDeleteListener.dispose()
      eventListener.didCreateListener.dispose()
      eventListener.fileSystemWatcher.dispose()
    }
    this.eventListeners = []

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
          arguments: [element],
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
          light: lightDefault,
          dark: darkDefault
        }
      } else {
        treeItem.iconPath = {
          light: lightTarget,
          dark: darkTarget
        }
      }

      return treeItem
    } else if (element.contextValue === 'antDepends') {
      let treeItem = {
        label: element.name,
        command: {
          arguments: [element],
          command: 'vscode-ant.selectedAntTarget',
          title: 'selectedAntTarget'
        },
        contextValue: 'antDepends',
        tooltip: `${element.description} (${element.sourceFile})`,
        iconPath: {
          light: lightDependency,
          dark: darkDependency
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
      messageHelper.showInformationMessage('No build.xml in empty workspace.')
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

  getRoots () {
    return new Promise(async (resolve, reject) => {
      try {
        var buildFilename = await this.BuildFileParser.findBuildFile(this.buildFileDirectories.split(','), this.buildFilenames.split(','))
      } catch (error) {
        if (this.workspaceFolderNumber < (this.workspaceFolders.length - 1)) {
          this.workspaceFolderNumber++
          this.setWorkspaceFolder()
          this.refresh()
        } else {
          messageHelper.showInformationMessage('Workspace has no build.xml files.')
        }

        return resolve([])
      }

      try {
        var buildFileObj = await this.BuildFileParser.parseBuildFile(buildFilename)
      } catch (error) {
        messageHelper.showErrorMessage('Error reading ' + buildFilename + '!')
        return reject(new Error('Error reading build.xml!: ' + error))
      }

      try {
        var projectDetails = await this.BuildFileParser.getProjectDetails(buildFileObj)
        var [buildTargets, buildSourceFiles] = await this.BuildFileParser.getTargets(buildFilename, buildFileObj, [], [])

        messageHelper.showInformationMessage('Targets loaded from ' + buildFilename + '!')

        // const buildSourceFiles = _.uniq(_.map(buildTargets, 'sourceFile'))
        for (const buildSourceFile of buildSourceFiles) {
          this.watchBuildFile(this.rootPath, buildSourceFile)
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
        messageHelper.showErrorMessage('Error parsing build.xml!')
        return reject(new Error('Error parsing build.xml!:' + error))
      }
    })
  }

  getTargetsInProject () {
    return new Promise((resolve) => {
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
          description: target.description,
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
    return new Promise((resolve) => {
      var depends = element.depends.split(',').map((depends) => {
        var dependsTarget = {
          id: depends,
          contextValue: 'antDepends',
          name: depends,
          description: '',
          sourceFile: ''
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
          dependsTarget.description = target.description
        }
        return dependsTarget
      })
      resolve(depends)
    })
  }

  selectedAntTarget (targetElement) {
    selectedAntTarget = targetElement
  }

  runSelectedAntTarget () {
    if (selectedAntTarget) {
      var target = selectedAntTarget.name
      if (target.indexOf(' ') >= 0) {
        target = '"' + target + '"'
      }
      vscode.commands.executeCommand('vscode-ant.runAntTarget', {name: target, sourceFile: selectedAntTarget.sourceFile})
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
