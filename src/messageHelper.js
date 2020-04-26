const vscode = require('vscode')

const prefix = 'ATR: '

function showErrorMessage (message) {
  vscode.window.showErrorMessage(prefix + message)
}
exports.showErrorMessage = showErrorMessage

function showInformationMessage (message) {
  vscode.window.showInformationMessage(prefix + message)
}
exports.showInformationMessage = showInformationMessage
