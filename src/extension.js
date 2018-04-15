const vscode = require('vscode')
const AntRunnerViewProvider = require('./AntRunnerViewProvider')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  const antRunnerViewProvider = new AntRunnerViewProvider(context)

  var antRunnerView = vscode.window.createTreeView('antRunnerView', {treeDataProvider: antRunnerViewProvider})
  // antRunnerView = vscode.window.registerTreeDataProvider('antRunnerView', antRunnerViewProvider)
  context.subscriptions.push(antRunnerView)

  var runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antRunnerViewProvider.runAntTarget)
  context.subscriptions.push(runAntTarget)

  var runAntDependency = vscode.commands.registerCommand('vscode-ant.runAntDependency', antRunnerViewProvider.runAntTarget)
  context.subscriptions.push(runAntDependency)

  var runSelectedAntTarget = vscode.commands.registerCommand('vscode-ant.runSelectedAntTarget', antRunnerViewProvider.runSelectedAntTarget)
  context.subscriptions.push(runSelectedAntTarget)

  var refreshAntTargets = vscode.commands.registerCommand('vscode-ant.refreshAntTargets', () => antRunnerViewProvider.refresh())
  context.subscriptions.push(refreshAntTargets)

  var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(() => antRunnerViewProvider.onDidChangeConfiguration())
  context.subscriptions.push(onDidChangeConfiguration)

  var terminalClosed = vscode.window.onDidCloseTerminal(antRunnerViewProvider.terminalClosed)
  context.subscriptions.push(terminalClosed)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
