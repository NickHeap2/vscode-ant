const vscode = require('vscode')
const AntTreeDataProvider = require('./AntTreeDataProvider')
const AntTargetRunner = require('./AntTargetRunner')
const AutoTargetRunner = require('./AutoTargetRunner')
const AntBuildFileProvider = require('./AntBuildFileProvider')

var antTargetRunner
var autoTargetRunner
var antTreeDataProvider
var antBuildFileProvider

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  antTargetRunner = new AntTargetRunner(context)
  autoTargetRunner = new AutoTargetRunner(context)
  // autoTargetRunner.startWatching()

  antTreeDataProvider = new AntTreeDataProvider(context)
  // antTreeDataProvider.targetRunner = antTargetRunner
  antBuildFileProvider = new AntBuildFileProvider(context)

  const antRunnerView = vscode.window.createTreeView('antRunnerView', {treeDataProvider: antTreeDataProvider})
  context.subscriptions.push(antRunnerView)

  const setRunnerWorkspaceFolder = vscode.commands.registerCommand('vscode-ant.setRunnerWorkspaceFolder', antTargetRunner.setWorkspaceFolder.bind(antTargetRunner))
  context.subscriptions.push(setRunnerWorkspaceFolder)

  const setAutoWorkspaceFolder = vscode.commands.registerCommand('vscode-ant.setAutoWorkspaceFolder', autoTargetRunner.setWorkspaceFolder.bind(autoTargetRunner))
  context.subscriptions.push(setAutoWorkspaceFolder)

  const changeWorkspaceFolder = vscode.commands.registerCommand('vscode-ant.changeWorkspaceFolder', antTargetRunner.setWorkspaceFolder.bind(antTargetRunner))
  context.subscriptions.push(changeWorkspaceFolder)

  const buildFilesChanged = vscode.commands.registerCommand('vscode-ant.buildFilesChanged', antTreeDataProvider.onBuildFilesChanges.bind(antTreeDataProvider))
  context.subscriptions.push(buildFilesChanged)

  const runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antTargetRunner.nodeRunAntTarget.bind(antTargetRunner))
  context.subscriptions.push(runAntTarget)

  const revealDefinition = vscode.commands.registerCommand('vscode-ant.revealDefinition', antTargetRunner.revealDefinition.bind(antTargetRunner))
  context.subscriptions.push(revealDefinition)

  const runAntDependency = vscode.commands.registerCommand('vscode-ant.runAntDependency', antTargetRunner.nodeRunAntTarget.bind(antTargetRunner))
  context.subscriptions.push(runAntDependency)

  const selectedAntTarget = vscode.commands.registerCommand('vscode-ant.selectedAntTarget', antTreeDataProvider.selectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(selectedAntTarget)

  const runSelectedAntTarget = vscode.commands.registerCommand('vscode-ant.runSelectedAntTarget', antTreeDataProvider.runSelectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(runSelectedAntTarget)

  const refreshAntTargets = vscode.commands.registerCommand('vscode-ant.refreshAntTargets', refresh)
  context.subscriptions.push(refreshAntTargets)

  // target runner needs to know when the terminal closes
  const terminalClosed = vscode.window.onDidCloseTerminal(antTargetRunner.terminalClosed, antTargetRunner)
  context.subscriptions.push(terminalClosed)
}
exports.activate = activate

function refresh () {
  if (antBuildFileProvider) {
    antBuildFileProvider.refresh()
  }
  if (antTargetRunner) {
    antTargetRunner.onDidChangeConfiguration()
  }
  if (autoTargetRunner) {
    autoTargetRunner.onDidChangeConfiguration()
  }
  if (antTreeDataProvider) {
    antBuildFileProvider.refresh()
  }
}

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
