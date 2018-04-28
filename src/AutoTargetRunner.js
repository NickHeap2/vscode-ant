const fs = require('fs')
const vscode = require('vscode')
const util = require('./util')

var extensionContext
var autoFile

module.exports = class AutoTargetRunner {
  constructor (context, targetRunner) {
    extensionContext = context

    this.targetRunner = targetRunner
    this.autoRunTasks = []

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
    let configOptions = vscode.workspace.getConfiguration('ant')
    this.autoRunDelay = parseInt(configOptions.get('autoRunDelay', '1000'))
  }

  autoRunTarget (target, delay, context) {
    console.log(new Date().getMilliseconds())
    console.log(context.fsPath)
    console.log(target)
    console.log(delay)
    if (this.autoRunTasks[target]) {
      console.log('Clearing entry for:' + target)
      try {
        clearTimeout(this.autoRunTasks[target])
      } catch (err) {
        console.log(err)
      }
      this.autoRunTasks[target] = undefined
    }
    console.log('Queueing entry for:' + target)
    this.autoRunTasks[target] = setTimeout(() => {
      console.log('Running entry for:' + target)
      this.autoRunTasks[target] = undefined
      this.targetRunner.runAntTarget({name: target})
    }, delay, target)
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
          vscode.window.showInformationMessage('Error parsing build.auto for autotargets!')
          return
        }
        this.autoTargets = obj.autotargets

        if (this.autoTargets) {
          vscode.window.showInformationMessage('Parsed build.auto for autotargets.')
          for (const autotarget of this.autoTargets) {
            let relativePattern = new vscode.RelativePattern(this.rootPath, autotarget.watch)
            autotarget.autoFileWatcher = vscode.workspace.createFileSystemWatcher(relativePattern)
            extensionContext.subscriptions.push(autotarget.autoFileWatcher)

            // autoFileWatcher.onDidChange(this.OnDidChangeAutoTarget, this, extensionContext.subscriptions)
            // autoFileWatcher.onDidDelete(this.OnDidChangeAutoTarget, this, extensionContext.subscriptions)
            // autoFileWatcher.onDidCreate(this.OnDidChangeAutoTarget, this, extensionContext.subscriptions)
            autotarget.autoFileWatcher.onDidChange((context) => {
              this.autoRunTarget(autotarget.target, autotarget.delay, context)
            }, this, extensionContext.subscriptions)
            autotarget.autoFileWatcher.onDidDelete((context) => {
              this.autoRunTarget(autotarget.target, autotarget.delay, context)
            }, this, extensionContext.subscriptions)
            autotarget.autoFileWatcher.autoFileWatchereWatcher.onDidCreate((context) => {
              this.autoRunTarget(autotarget.target, autotarget.delay, context)
            }, this, extensionContext.subscriptions)
          }
        }
      })
    }
    // this.watchAutoTarget(workspaceFolders)
  }
}
