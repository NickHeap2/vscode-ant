const vscode = require('vscode')
const path = require('path')

var extensionContext

module.exports = class AntWrapper {
  constructor (context) {
    extensionContext = context

    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    extensionContext.subscriptions.push(onDidChangeConfiguration)
  }

  static instance () {
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  async getConfigOptions () {
    let configOptions = vscode.workspace.getConfiguration('ant', null)

    this.antHome = configOptions.get('home', '')
    if (this.antHome === '' || typeof this.antHome === 'undefined') {
      this.antHome = path.join(extensionContext.extensionPath, 'dist', 'apache-ant')
    }
    
    this.antExecutable = configOptions.get('executable', 'ant')
    if (this.antExecutable === '' || typeof this.antExecutable === 'undefined') {
      if (process.platform === 'win32') {
        this.antExecutable = 'ant.bat'
      } else {
        this.antExecutable = 'ant.sh'
      }
    }
  }

}
