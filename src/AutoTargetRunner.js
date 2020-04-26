const filehelper = require('./filehelper')
const fs = require('fs')
const vscode = require('vscode')
const util = require('./filehelper')
const minimatch = require('minimatch')
const messageHelper = require('./messageHelper')

var extensionContext
var configOptions

module.exports = class AutoTargetRunner {
  constructor (context, targetRunner) {
    extensionContext = context

    this.autoFile = ''

    this.buildFileDirectories = '.'
    this.autoFilename = 'build.auto'

    this.targetRunner = targetRunner
    this.autoRunTasks = []
    this.autoTargets = []

    var workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      this.rootPath = workspaceFolders[0].uri.fsPath

      this.getConfigOptions()
    }
  }

  startWatching () {
    this.watchAutoTargetsFile()

    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    extensionContext.subscriptions.push(onDidChangeConfiguration)
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  async getConfigOptions () {
    configOptions = vscode.workspace.getConfiguration('ant', null)

    this.buildFileDirectories = configOptions.get('buildFileDirectories', '.')
    if (this.buildFileDirectories === '' || typeof this.buildFileDirectories === 'undefined') {
      this.buildFileDirectories = '.'
    }

    this.autoFile = await this.getBuildAutoFileName(this.rootPath, this.buildFileDirectories, this.autoFilename)
    this.loadAutoTargets()
  }

  autoRunTarget (targets, delay) {
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
    var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(this.autoFile)
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

  getBuildAutoFileName (rootPath, searchDirectories, searchFileNames) {
    return new Promise(async (resolve, reject) => {
      try {
        var filename = await filehelper.findfirstFile(rootPath, searchDirectories.split(','), searchFileNames.split(','))
        resolve(filename)
      } catch (error) {
        return reject(new Error('No build file found!'))
      }
    })
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

    var autoPathName = filehelper.getRootFile(this.rootPath, this.autoFile)

    if (util.pathExists(autoPathName)) {
      fs.readFile(autoPathName, 'utf-8', (err, data) => {
        if (err) {
          return
        }
        var obj
        try {
          obj = JSON.parse(data)
        } catch (err) {
          console.log(err)
          messageHelper.showErrorMessage('Error parsing ' + this.autoFile + ' for autotargets! (' + err.message + ')')
          return
        }
        this.autoTargets = obj.autoTargets

        if (this.autoTargets) {
          messageHelper.showInformationMessage('Parsed ' + this.autoFile + ' for autotargets.')
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
        this.autoRunTarget(autoTarget.runTargets, autoTarget.initialDelayMs)
        break
      }
    }
  }
}
