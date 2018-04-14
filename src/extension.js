const vscode = require('vscode')
const AntRunnerViewProvider = require('./AntRunnerViewProvider')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  const antRunnerViewProvider = new AntRunnerViewProvider(context)

  var antRunnerView = vscode.window.registerTreeDataProvider('antRunnerView', antRunnerViewProvider)
  context.subscriptions.push(antRunnerView)

  var runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antRunnerViewProvider.runAntTarget)
  context.subscriptions.push(runAntTarget)

  var terminalClosed = vscode.window.onDidCloseTerminal(antRunnerViewProvider.terminalClosed)
  context.subscriptions.push(terminalClosed)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
