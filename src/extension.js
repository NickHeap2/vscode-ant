const vscode = require('vscode')
const AntRunnerViewProvider = require('./AntRunnerViewProvider')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate (context) {
  // look for .xml files that are registered
  const workspaceFolders = vscode.workspace.workspaceFolders
  const rootPath = workspaceFolders[0].uri.fsPath

  const antRunnerViewProvider = new AntRunnerViewProvider(rootPath)

  var antRunnerView = vscode.window.registerTreeDataProvider('antRunnerView', antRunnerViewProvider)
  context.subscriptions.push(antRunnerView)

  var runAntTarget = vscode.commands.registerCommand('vscode-ant.runAntTarget', antRunnerViewProvider.runAntTask)
  context.subscriptions.push(runAntTarget)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {
}
exports.deactivate = deactivate
