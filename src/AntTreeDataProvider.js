const vscode = require('vscode')
const _ = require('lodash')
const filehelper = require('./filehelper')
const path = require('path')
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
    this.eventListeners = []
    this.buildFiles = []

    // event for notify of change of data
    this._onDidChangeTreeData = new vscode.EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event

    // trap config and workspaces changes to pass updates
    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeConfiguration)

    this.getConfigOptions()
  }

  // setWorkspaceFolder () {
  //   this.rootPath = this.workspaceFolders[this.workspaceFolderNumber].uri.fsPath
  //   // this.watchBuildXml(workspaceFolders)
  //   this.BuildFileParser = new BuildFileParser(this.workspaceFolders[this.workspaceFolderNumber].uri.fsPath)

  //   vscode.commands.executeCommand('vscode-ant.setRunnerWorkspaceFolder', this.workspaceFolders[this.workspaceFolderNumber])
  //   vscode.commands.executeCommand('vscode-ant.setAutoWorkspaceFolder', this.workspaceFolders[this.workspaceFolderNumber])
  // }

  onBuildFilesChanges (buildFiles) {
    this.buildFiles = buildFiles
    this.refresh()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
    this.refresh()
  }

  getConfigOptions () {
    configOptions = vscode.workspace.getConfiguration('ant', null)
    this.sortTargetsAlphabetically = configOptions.get('sortTargetsAlphabetically', 'true')
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
        id: element.id + '_' + element.filePath,
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
        // id: element.id + '_' + element.name,
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
      if (element.isDefault) {
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
        // id: element.id + '_' + element.name,
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
    if (this.buildFiles.length === 0) {
      messageHelper.showInformationMessage('No build.xml in empty workspace.')
      return new Promise((resolve, reject) => {
        resolve([])
        reject(new Error('Failed somehow'))
      })
    }
    return new Promise((resolve, reject) => {
      // add root element?
      if (!element) {
        // add file roots
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
          this.getTargetsInProject(element)
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
      var roots = []
      for (let buildFile of this.buildFiles) {
        var buildFileroot = {
          id: buildFile.fullBuildFilename,
          contextValue: 'antFile',
          filePath: path.dirname(buildFile.fullBuildFilename),
          fileName: path.basename(buildFile.fullBuildFilename),
          project: buildFile.projectDetails.name
        }
        roots.push(buildFileroot)
      }

      resolve(roots)
    })
  }

  getBuildFile (elementId) {
    // get details of this buildFile
    return _.find(this.buildFiles, (o) => {
      if (o.fullBuildFilename === elementId) {
        return true
      }
      return false
    })
  }

  getTargetsInProject (element) {
    return new Promise((resolve) => {
      var buildFile = this.getBuildFile(element.id)
      if (!buildFile) {
        resolve([])
      }

      let targets = buildFile.buildTargets.map((target) => {
        var antTarget = {
          id: buildFile.fullBuildFilename + '_' + target.name,
          contextValue: 'antTarget',
          sourceFile: target.sourceFile,
          depends: target.depends,
          description: target.description,
          name: target.name,
          isDefault: (target.name === buildFile.projectDetails.default)
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

  nodeRunAntTarget (context) {
    if (!context) {
      return
    }

    var target = context.name
    if (target.indexOf(' ') >= 0) {
      target = '"' + target + '"'
    }

    var buildFile = this.getBuildFile(context.sourceFile)
    if (!buildFile) {
      return
    }

    buildFile.antTargetRunner.runAntTarget({name: target, sourceFile: context.sourceFile})
  }

  selectedAntTarget (targetElement) {
    selectedAntTarget = targetElement
  }

  revealDefinition (target) {
    vscode.workspace.openTextDocument(target.sourceFile)
      .then((document) => {
        return vscode.window.showTextDocument(document)
      })
      .then((textEditor) => {
        // find the line
        let text = textEditor.document.getText()
        let regexp = new RegExp('target[.\\s]+name[\\s]*=["\']' + target.name + '["\']', 'gm')
        let offset = regexp.exec(text)
        if (offset) {
          let position = textEditor.document.positionAt(offset.index)
          // reveal the position in the center
          textEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter)
          // position the cursor
          let startSelection = textEditor.document.positionAt(offset.index)
          let endSelection = textEditor.document.positionAt(offset.index + offset[0].length)
          textEditor.selection = new vscode.Selection(startSelection, endSelection)
        }
      })
  }

  runSelectedAntTarget () {
    if (selectedAntTarget) {
      var target = selectedAntTarget.name

      var buildFile = this.getBuildFile(selectedAntTarget.sourceFile)
      if (!buildFile) {
        return
      }

      if (target.indexOf(' ') >= 0) {
        target = '"' + target + '"'
      }

      buildFile.antTargetRunner.runAntTarget({name: target, sourceFile: selectedAntTarget.sourceFile})
      // vscode.commands.executeCommand('vscode-ant.runAntTarget', {name: target, sourceFile: selectedAntTarget.sourceFile})
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
