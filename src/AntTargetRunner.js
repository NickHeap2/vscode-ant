const vscode = require('vscode')
const dotenv = require('dotenv')
const filehelper = require('./filehelper')
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

  async getConfigOptions () {
    let configOptions = vscode.workspace.getConfiguration('ant', null)
    this.antHome = configOptions.get('home', '')
    this.envVarsFile = configOptions.get('envVarsFile', 'build.env')
    this.antExecutable = configOptions.get('executable', 'ant')
    this.ansiconExe = configOptions.get('ansiconExe', '')

    this.buildFileDirectories = configOptions.get('buildFileDirectories', '.')
    if (this.buildFileDirectories === '' || typeof this.buildFileDirectories === 'undefined') {
      this.buildFileDirectories = '.'
    }

    if (this.envVarsFile === '' || typeof this.envVarsFile === 'undefined') {
      this.envVarsFile = 'build.env'
    }

    this.envVarsFile = await filehelper.findfirstFile(this.rootPath, this.buildFileDirectories.split(','), this.envVarsFile.split(','))

    if (this.antTerminal) {
      this.antTerminal.dispose()
      this.antTerminal = null
    }
  }

  nodeRunAntTarget (context) {
    if (!context) {
      return
    }

    var target = context.name
    if (target.indexOf(' ') >= 0) {
      target = '"' + target + '"'
    }

    this.runAntTarget({ name: target, sourceFile: context.sourceFile })
  }

  runAntTarget (context) {
    if (!context) {
      return
    }

    const targets = context.name
    const buildFile = context.sourceFile

    if (!this.antTerminal) {
      var envVars = {}
      if (this.envVarsFile && filehelper.pathExists(filehelper.getRootFile(this.rootPath, this.envVarsFile))) {
        envVars = dotenv.parse(fs.readFileSync(filehelper.getRootFile(this.rootPath, this.envVarsFile)))
      }

      if (this.antHome) {
        envVars.ANT_HOME = this.antHome
      }

      // use ansicon on win32?
      if (process.platform === 'win32' && this.ansiconExe && filehelper.pathExists(this.ansiconExe)) {
        if (envVars.ANT_ARGS === undefined) {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.AnsiColorLogger'
        }
        let integratedShell = vscode.workspace.getConfiguration('terminal.integrated.shell', null).windows
        if (integratedShell) {
          this.antTerminal = vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars, shellPath: this.ansiconExe, shellArgs: [ integratedShell ]})
        } else {
          this.antTerminal = vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars, shellPath: this.ansiconExe})
        }
      } else {
        this.antTerminal = vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars}) // , shellPath: 'C:\\WINDOWS\\System32\\cmd.exe' })
      }
    }

    if (buildFile && buildFile !== 'build.xml') {
      this.antTerminal.sendText(`${this.antExecutable} -buildfile ${buildFile} ${targets}`)
    } else {
      this.antTerminal.sendText(`${this.antExecutable} ${targets}`)
    }

    this.antTerminal.show(true)
  }

  revealDefinition (target) {
    vscode.workspace.openTextDocument(filehelper.getRootFile(this.rootPath, target.sourceFile))
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
