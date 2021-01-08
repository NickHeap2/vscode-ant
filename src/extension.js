const vscode = require('vscode')
const AntTreeDataProvider = require('./AntTreeDataProvider')
const AntBuildFileProvider = require('./AntBuildFileProvider')

var antTreeDataProvider
var antBuildFileProvider

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  antTreeDataProvider = new AntTreeDataProvider(context)
  antBuildFileProvider = new AntBuildFileProvider(context)

  const antRunnerView = vscode.window.createTreeView('antRunnerView', {treeDataProvider: antTreeDataProvider})
  context.subscriptions.push(antRunnerView)

  const buildFilesChanged = vscode.commands.registerCommand('vscode-ant.buildFilesChanged', antTreeDataProvider.onBuildFilesChanges.bind(antTreeDataProvider))
  context.subscriptions.push(buildFilesChanged)

  const runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antTreeDataProvider.nodeRunAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(runAntTarget)

  const revealDefinition = vscode.commands.registerCommand('vscode-ant.revealDefinition', antTreeDataProvider.revealDefinition.bind(antTreeDataProvider))
  context.subscriptions.push(revealDefinition)

  const runAntDependency = vscode.commands.registerCommand('vscode-ant.runAntDependency', antTreeDataProvider.nodeRunAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(runAntDependency)

  const selectedAntTarget = vscode.commands.registerCommand('vscode-ant.selectedAntTarget', antTreeDataProvider.selectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(selectedAntTarget)

  const runSelectedAntTarget = vscode.commands.registerCommand('vscode-ant.runSelectedAntTarget', antTreeDataProvider.runSelectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(runSelectedAntTarget)

  const refreshAntTargets = vscode.commands.registerCommand('vscode-ant.refreshAntTargets', refresh)
  context.subscriptions.push(refreshAntTargets)
}
exports.activate = activate

function refresh () {
  if (antBuildFileProvider) {
    antBuildFileProvider.refresh()
  }
  if (antTreeDataProvider) {
    antBuildFileProvider.refresh()
  }
}

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
