const vscode = require('vscode')
const AntTreeDataProvider = require('./AntTreeDataProvider')
const AntTargetRunner = require('./AntTargetRunner')
const AutoTargetRunner = require('./AutoTargetRunner')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  const antTargetRunner = new AntTargetRunner(context)
  const autoTargetRunner = new AutoTargetRunner(context, antTargetRunner)

  const antTreeDataProvider = new AntTreeDataProvider(context)
  antTreeDataProvider.targetRunner = antTargetRunner

  var antRunnerView = vscode.window.createTreeView('antRunnerView', {treeDataProvider: antTreeDataProvider})
  context.subscriptions.push(antRunnerView)

  var runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antTargetRunner.runAntTarget.bind(antTargetRunner))
  context.subscriptions.push(runAntTarget)

  var revealDefinition = vscode.commands.registerCommand('vscode-ant.revealDefinition', antTargetRunner.revealDefinition.bind(antTargetRunner))
  context.subscriptions.push(revealDefinition)

  var runAntDependency = vscode.commands.registerCommand('vscode-ant.runAntDependency', antTargetRunner.runAntTarget.bind(antTargetRunner))
  context.subscriptions.push(runAntDependency)

  var selectedAntTarget = vscode.commands.registerCommand('vscode-ant.selectedAntTarget', antTreeDataProvider.selectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(selectedAntTarget)

  var runSelectedAntTarget = vscode.commands.registerCommand('vscode-ant.runSelectedAntTarget', antTreeDataProvider.runSelectedAntTarget.bind(antTreeDataProvider))
  context.subscriptions.push(runSelectedAntTarget)

  var refreshAntTargets = vscode.commands.registerCommand('vscode-ant.refreshAntTargets', antTreeDataProvider.refresh.bind(antTreeDataProvider))
  context.subscriptions.push(refreshAntTargets)

  // target runner needs to know when the terminal closes
  var terminalClosed = vscode.window.onDidCloseTerminal(antTargetRunner.terminalClosed, antTargetRunner)
  context.subscriptions.push(terminalClosed)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
