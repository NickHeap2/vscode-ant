const vscode = require('vscode')
const AntRunnerViewProvider = require('./AntRunnerViewProvider')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  const antRunnerViewProvider = new AntRunnerViewProvider(context)

  var antRunnerView = vscode.window.createTreeView('antRunnerView', {treeDataProvider: antRunnerViewProvider})
  // antRunnerView = vscode.window.registerTreeDataProvider('antRunnerView', antRunnerViewProvider)
  context.subscriptions.push(antRunnerView)

  var runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antRunnerViewProvider.runAntTarget.bind(antRunnerViewProvider))
  context.subscriptions.push(runAntTarget)

  var revealDefinition = vscode.commands.registerCommand('vscode-ant.revealDefinition', antRunnerViewProvider.revealDefinition.bind(antRunnerViewProvider))
  context.subscriptions.push(revealDefinition)

  var runAntDependency = vscode.commands.registerCommand('vscode-ant.runAntDependency', antRunnerViewProvider.runAntTarget.bind(antRunnerViewProvider))
  context.subscriptions.push(runAntDependency)

  var selectedAntTarget = vscode.commands.registerCommand('vscode-ant.selectedAntTarget', antRunnerViewProvider.selectedAntTarget.bind(antRunnerViewProvider))
  context.subscriptions.push(selectedAntTarget)

  var runSelectedAntTarget = vscode.commands.registerCommand('vscode-ant.runSelectedAntTarget', antRunnerViewProvider.runSelectedAntTarget.bind(antRunnerViewProvider))
  context.subscriptions.push(runSelectedAntTarget)

  var refreshAntTargets = vscode.commands.registerCommand('vscode-ant.refreshAntTargets', antRunnerViewProvider.refresh.bind(antRunnerViewProvider))
  context.subscriptions.push(refreshAntTargets)

  var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(antRunnerViewProvider.onDidChangeConfiguration.bind(antRunnerViewProvider))
  context.subscriptions.push(onDidChangeConfiguration)

  var onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(antRunnerViewProvider.onDidChangeWorkspaceFolders.bind(antRunnerViewProvider))
  context.subscriptions.push(onDidChangeWorkspaceFolders)

  var terminalClosed = vscode.window.onDidCloseTerminal(antRunnerViewProvider.terminalClosed)
  context.subscriptions.push(terminalClosed)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
