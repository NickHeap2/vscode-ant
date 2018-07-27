const vscode = require('vscode')
const dotenv = require('dotenv')
const util = require('./util')
const fs = require('fs')

var extensionContext

module.exports = class AntTargetRunner {
  constructor (context) {
    extensionContext = context
    this.rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath
    this.autoTargetRunner = null

    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    extensionContext.subscriptions.push(onDidChangeConfiguration)

    var onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders.bind(this))
    extensionContext.subscriptions.push(onDidChangeWorkspaceFolders)

    this.getConfigOptions()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  onDidChangeWorkspaceFolders () {
    this.rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath
  }

  getConfigOptions () {
    let configOptions = vscode.workspace.getConfiguration('ant')
    this.antHome = configOptions.get('home', '')
    this.envVarsFile = configOptions.get('envVarsFile', 'build.env')
    this.antExecutable = configOptions.get('executable', 'ant')
    this.ansiconExe = configOptions.get('ansiconExe', '')

    if (this.antTerminal) {
      this.antTerminal.dispose()
      this.antTerminal = null
    }
  }

  runAntTarget (context) {
    if (!context) {
      return
    }

    var target = context.name

    if (!this.antTerminal) {
      var envVars
      if (this.envVarsFile && util.pathExists(util.getRootFile(this.rootPath, this.envVarsFile))) {
        envVars = dotenv.parse(fs.readFileSync(util.getRootFile(this.rootPath, this.envVarsFile)))
      }

      if (this.antHome) {
        envVars.ANT_HOME = this.antHome
      }

      // use ansicon on win32?
      if (process.platform === 'win32' && this.ansiconExe && util.pathExists(this.ansiconExe)) {
        if (envVars.ANT_ARGS === undefined) {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.AnsiColorLogger'
        }

        this.antTerminal = vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars, shellPath: this.ansiconExe, shellArgs: [ vscode.workspace.getConfiguration('terminal.integrated.shell').windows ]})
      } else {
        this.antTerminal = vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars}) // , shellPath: 'C:\\WINDOWS\\System32\\cmd.exe' })
      }
    }

    this.antTerminal.sendText(`${this.antExecutable} \"${target}\"`)
    this.antTerminal.show(true)
  }

  revealDefinition (target) {
    vscode.workspace.openTextDocument(util.getRootFile(this.rootPath, 'build.xml'))
      .then((document) => {
        return vscode.window.showTextDocument(document)
      })
      .then((textEditor) => {
        // find the line
        let text = textEditor.document.getText()
        let regexp = new RegExp('target[.\\s]+name[\\s]*=["\']' + target.name + '["\']', 'gm')
        let offset = regexp.exec(text)
        if (offset) {
          let position = textEditor.document.positionAt(offset.index)
          textEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter)
        }
      })
  }

  terminalClosed (terminal) {
    if (terminal.name === this.antTerminal.name) {
      this.antTerminal.dispose()
      this.antTerminal = null
    }
  }
}
