const vscode = require('vscode')
// const _ = require('lodash')
const filehelper = require('./filehelper')
const path = require('path')
const BuildFileParser = require('./BuildFileParser.js')
const messageHelper = require('./messageHelper')
const AntTargetRunner = require('./AntTargetRunner')

var configOptions

module.exports = class AntBuildFileProvider {
  constructor (context) {
    this.extensionContext = context

    // trap config and workspaces changes to pass updates
    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeConfiguration)

    var onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeWorkspaceFolders)

    this.BuildFileParser = new BuildFileParser('')

    this.buildFilenames = 'build.xml'
    this.buildFileDirectories = '.'
    this.eventListeners = []
    this.buildFiles = []

    this.workspaceFolders = vscode.workspace.workspaceFolders

    this.getConfigOptions()
    this.refresh()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
    this.refresh()
  }

  onDidChangeWorkspaceFolders () {
    this.workspaceFolders = vscode.workspace.workspaceFolders

    this.refresh()
  }

  findBuildFileOfWorkspace (workspaceRootPath, searchDirectories, searchFileNames) {
    return new Promise(async (resolve, reject) => {
      try {
        var filename = await filehelper.findfirstFile(workspaceRootPath, searchDirectories, searchFileNames)
        resolve(filename)
      } catch (error) {
        return reject(new Error('No build file found!'))
      }
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

  getWorkspaceBuildFiles () {
    return new Promise(async (resolve, reject) => {
      this.buildFiles = []

      // check for empty workspace
      if (!this.workspaceFolders) {
        return resolve(this.buildFiles)
      }

      for (const workspaceFolder of this.workspaceFolders) {
        const workspaceFolderPath = workspaceFolder.uri.fsPath
        try {
          var buildFilename = await this.findBuildFileOfWorkspace(workspaceFolderPath, this.buildFileDirectories.split(','), this.buildFilenames.split(','))
        } catch (error) {
          // TODO - what do we add here?
          continue
        }

        var fullBuildFilename = path.join(workspaceFolderPath, buildFilename)

        try {
          var buildFileObj = await this.BuildFileParser.parseBuildFile(fullBuildFilename)
        } catch (error) {
          messageHelper.showErrorMessage(`Error reading ${buildFilename} !`)
          // return reject(new Error('Error reading build.xml!: ' + error))
          continue
        }

        try {
          var buildFile = { buildFilename: buildFilename, fullBuildFilename: fullBuildFilename, projectDetails: {}, buildTargets: [], buildSourceFiles: [] }
          buildFile.projectDetails = this.BuildFileParser.getProjectDetails(buildFileObj)

          var [buildTargets, buildSourceFiles] = await this.BuildFileParser.getTargets(fullBuildFilename, buildFileObj, [], [])
          buildFile.buildTargets = buildTargets
          buildFile.buildSourceFiles = buildSourceFiles

          // create an ant target runnner for this build file
          buildFile.antTargetRunner = new AntTargetRunner(this.extensionContext)
          buildFile.antTargetRunner.setWorkspaceFolder(workspaceFolderPath)

          messageHelper.showInformationMessage(`Targets loaded from ${fullBuildFilename} !`)

          // const buildSourceFiles = _.uniq(_.map(buildTargets, 'sourceFile'))
          for (const buildSourceFile of buildFile.buildSourceFiles) {
            this.watchBuildFile(workspaceFolderPath, buildSourceFile)
          }

          this.buildFiles.push(buildFile)
        } catch (error) {
          messageHelper.showErrorMessage(`Error getting targets from ${fullBuildFilename} !`)
          continue
          // return reject(new Error('Error parsing build.xml!:' + error))
        }
      }
      if (this.buildFileDirectories.length === 0) {
        messageHelper.showInformationMessage('Workspace has no ant build files.')
      }
      return resolve(this.buildFiles)
    })
  }

  async refresh () {
    // clean up target runners
    for (const buildFile of this.buildFiles) {
      delete buildFile.antTargetRunner
    }

    // remove event listeners
    for (const eventListener of this.eventListeners) {
      eventListener.didChangeListener.dispose()
      eventListener.didDeleteListener.dispose()
      eventListener.didCreateListener.dispose()
      eventListener.fileSystemWatcher.dispose()
    }
    this.eventListeners = []

    await this.getWorkspaceBuildFiles()
    vscode.commands.executeCommand('vscode-ant.buildFilesChanged', this.buildFiles)
  }

  removeSubscription (item) {
    this.extensionContext.subscriptions.splice(this.extensionContext.subscriptions.indexOf(item), 1)
  }

  watchBuildFile (rootPath, buildFileName) {
    const buildFile = filehelper.getRootFile(rootPath, buildFileName)
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
}
