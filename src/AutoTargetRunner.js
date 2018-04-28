const fs = require('fs')
const vscode = require('vscode')
const util = require('./util')
const minimatch = require('minimatch')

var extensionContext
var autoFile

module.exports = class AutoTargetRunner {
  constructor (context, targetRunner) {
    extensionContext = context

    this.targetRunner = targetRunner
    this.autoRunTasks = []
    this.autoTargets = []

    this.getConfigOptions()

    this.loadAutoTargets()

    this.watchAutoTargetsFile()

    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    extensionContext.subscriptions.push(onDidChangeConfiguration)
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  getConfigOptions () {
  }

  autoRunTarget (targets, delay, context) {
    if (this.autoRunTasks[targets]) {
      // console.log('Clearing entry for:' + targets)
      try {
        clearTimeout(this.autoRunTasks[targets])
      } catch (err) {
        console.log(err)
      }
      this.autoRunTasks[targets] = undefined
    }
    // console.log('Queueing entry for:' + targets)
    this.autoRunTasks[targets] = setTimeout(() => {
      // console.log('Running entry for:' + targets)
      this.autoRunTasks[targets] = undefined
      this.targetRunner.runAntTarget({name: targets})
    }, delay, targets)
  }

  watchAutoTargetsFile () {
    var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(autoFile)
    extensionContext.subscriptions.push(fileSystemWatcher)

    fileSystemWatcher.onDidChange(() => {
      this.loadAutoTargets()
    }, this, extensionContext.subscriptions)
    fileSystemWatcher.onDidDelete(() => {
      this.loadAutoTargets()
    }, this, extensionContext.subscriptions)
    fileSystemWatcher.onDidCreate(() => {
      this.loadAutoTargets()
    }, this, extensionContext.subscriptions)
  }

  loadAutoTargets () {
    // clear current file watchers
    if (this.autoTargets) {
      for (const autotarget of this.autoTargets) {
        if (autotarget.autoFileWatcher) {
          autotarget.autoFileWatcher.dispose()
          autotarget.autoFileWatcher = undefined
        }
      }
    }

    this.rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath
    if (!this.rootPath) {
      return
    }
    autoFile = util.getRootFile(this.rootPath, 'build.auto')

    if (util.pathExists(autoFile)) {
      fs.readFile(autoFile, 'utf-8', (err, data) => {
        if (err) {
          return
        }
        var obj
        try {
          obj = JSON.parse(data)
        } catch (err) {
          console.log(err)
          vscode.window.showErrorMessage('Error parsing build.auto for autotargets!')
          return
        }
        this.autoTargets = obj.autoTargets

        if (this.autoTargets) {
          vscode.window.showInformationMessage('Parsed build.auto for autotargets.')
          for (const autoTarget of this.autoTargets) {
            let relativePattern = new vscode.RelativePattern(this.rootPath, autoTarget.filePattern)
            autoTarget.autoFileWatcher = vscode.workspace.createFileSystemWatcher(relativePattern)
            extensionContext.subscriptions.push(autoTarget.autoFileWatcher)

            autoTarget.autoFileWatcher.onDidChange((context) => {
              this.autoTargetChange(context)
            }, this, extensionContext.subscriptions)
            autoTarget.autoFileWatcher.onDidDelete((context) => {
              this.autoTargetChange(context)
            }, this, extensionContext.subscriptions)
            autoTarget.autoFileWatcher.onDidCreate((context) => {
              this.autoTargetChange(context)
            }, this, extensionContext.subscriptions)
          }
        }
      })
    }
  }

  autoTargetChange (context) {
    var relativePath = context.fsPath.replace(this.rootPath, '').substring(1)

    // find first match so we can have cascaded watchers
    for (const autoTarget of this.autoTargets) {
      if (minimatch(relativePath, autoTarget.filePattern)) {
        this.autoRunTarget(autoTarget.runTargets, autoTarget.initialDelayMs, context)
        break
      }
    }
  }
}
