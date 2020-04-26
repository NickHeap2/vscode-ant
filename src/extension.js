const vscode = require('vscode')
const AntTreeDataProvider = require('./AntTreeDataProvider')
const AntTargetRunner = require('./AntTargetRunner')
const AutoTargetRunner = require('./AutoTargetRunner')

var antTargetRunner
var autoTargetRunner
var antTreeDataProvider

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  antTargetRunner = new AntTargetRunner(context)
  autoTargetRunner = new AutoTargetRunner(context, antTargetRunner)
  autoTargetRunner.startWatching()

  antTreeDataProvider = new AntTreeDataProvider(context)
  antTreeDataProvider.targetRunner = antTargetRunner

  var antRunnerView = vscode.window.createTreeView('antRunnerView', {treeDataProvider: antTreeDataProvider})
  context.subscriptions.push(antRunnerView)

  var runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antTargetRunner.nodeRunAntTarget.bind(antTargetRunner))
  context.subscriptions.push(runAntTarget)

  var revealDefinition = vscode.commands.registerCommand('vscode-ant.revealDefinition', antTargetRunner.revealDefinition.bind(antTargetRunner))
  context.subscriptions.push(revealDefinition)

  var runAntDependency = vscode.commands.registerCommand('vscode-ant.runAntDependency', antTargetRunner.nodeRunAntTarget.bind(antTargetRunner))
  context.subscriptions.push(runAntDependency)

  var selectedAntTarget = vscode.commands.registerCommand('vscode-ant.selectedAntTarget', antTreeDataProvider.selectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(selectedAntTarget)

  var runSelectedAntTarget = vscode.commands.registerCommand('vscode-ant.runSelectedAntTarget', antTreeDataProvider.runSelectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(runSelectedAntTarget)

  var refreshAntTargets = vscode.commands.registerCommand('vscode-ant.refreshAntTargets', refresh)
  context.subscriptions.push(refreshAntTargets)

  // target runner needs to know when the terminal closes
  var terminalClosed = vscode.window.onDidCloseTerminal(antTargetRunner.terminalClosed, antTargetRunner)
  context.subscriptions.push(terminalClosed)
}
exports.activate = activate

function refresh () {
  antTargetRunner.onDidChangeConfiguration()
  autoTargetRunner.onDidChangeConfiguration()
  antTreeDataProvider.refresh()
}

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
