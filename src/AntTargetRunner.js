const dotenv = require('dotenv')
const fileHelper = require('./fileHelper')
const fs = require('fs')
const path = require('path')

module.exports = class AntTargetRunner {
  constructor (vscode, context) {
    this.extensionContext = context
    this.vscode = vscode
    this.autoTargetRunner = null

    var onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    this.extensionContext.subscriptions.push(onDidChangeConfiguration)
  }

  setWorkspaceFolder (workspaceFolder) {
    this.rootPath = workspaceFolder.uri.fsPath

    this.getConfigOptions()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  async getConfigOptions () {
    let configOptions = this.vscode.workspace.getConfiguration('ant', null)
    this.envVarsFile = configOptions.get('envVarsFile', 'build.env')
    this.ansiconExe = configOptions.get('ansiconExe', '')

    if (process.platform === 'win32') {
      this.initialiseCommand = configOptions.get('initialiseCommandOnWin32', '')
    } else {
      this.initialiseCommand = configOptions.get('initialiseCommandOnLinux', '')
    }

    this.antHome = configOptions.get('home', '')
    if (this.antHome === '' || typeof this.antHome === 'undefined') {
      this.antHome = path.join(this.extensionContext.extensionPath, 'dist', 'apache-ant')
    }

    this.antExecutable = configOptions.get('executable', 'ant')
    if (this.antExecutable === '' || typeof this.antExecutable === 'undefined') {
      if (process.platform === 'win32') {
        this.antExecutable = 'ant.bat'
      } else {
        this.antExecutable = 'ant.sh'
      }
      // if (!fileHelper.pathExists(this.antExecutable) && fileHelper.pathExists(this.antHome)) {
      //   const joinedPath = path.join(this.antHome, 'bin', this.antExecutable)
      //   if (fileHelper.pathExists(joinedPath)) {
      //     this.antExecutable = '"' + joinedPath + '"'
      //   }
      // }
    }

    // enable WinColorLogger?
    if (process.platform === 'win32' && fileHelper.pathExists(this.antHome)) {
      this.useWinColorLogger = fileHelper.pathExists(path.join(this.antHome, 'lib', 'WinColorLogger.jar'))
    }

    this.buildFileDirectories = configOptions.get('buildFileDirectories', '.')
    if (this.buildFileDirectories === '' || typeof this.buildFileDirectories === 'undefined') {
      this.buildFileDirectories = '.'
    }

    if (this.envVarsFile === '' || typeof this.envVarsFile === 'undefined') {
      this.envVarsFile = 'build.env'
    }

    this.envVarsFile = await fileHelper.findFirstFile(this.rootPath, this.buildFileDirectories.split(','), this.envVarsFile.split(','))

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
    if (target.length > 0
        && target[0] !== '"'
        && (target.indexOf(' ') >= 0
            || target.indexOf('(') >= 0
            || target.indexOf(')') >= 0)) {
      target = '"' + target + '"'
    }
    const triggerFile = context.triggerFile

    this.runAntTarget({ name: target, sourceFile: context.sourceFile, triggerFile })
  }

  runAntTarget (context) {
    if (!context) {
      return
    }

    const targets = context.name
    const buildFile = context.sourceFile
    const triggerFile = context.triggerFile

    if (!this.antTerminal) {
      var envVars = {}
      if (this.envVarsFile && fileHelper.pathExists(fileHelper.getRootFile(this.rootPath, this.envVarsFile))) {
        envVars = dotenv.parse(fs.readFileSync(fileHelper.getRootFile(this.rootPath, this.envVarsFile)))
      }

      if (this.antHome) {
        envVars.ANT_HOME = this.antHome
      }

      // add ant to path?
      if (!fileHelper.pathExists(this.antExecutable) && fileHelper.pathExists(this.antHome)) {
        const joinedPath = path.join(this.antHome, 'bin')
        if (fileHelper.pathExists(joinedPath)) {
          if (process.platform === 'win32') {
            envVars.Path = process.env.Path + ';' + joinedPath
          } else {
            envVars.Path = process.env.Path + ':' + joinedPath
          }
        }
      }

      // use ansicon on win32?
      if (process.platform === 'win32' && this.ansiconExe && fileHelper.pathExists(this.ansiconExe)) {
        if (envVars.ANT_ARGS === undefined) {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.AnsiColorLogger'
        }
        let integratedShell = this.vscode.workspace.getConfiguration('terminal.integrated.shell', null).windows
        if (integratedShell) {
          this.antTerminal = this.vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars, shellPath: this.ansiconExe, shellArgs: [ integratedShell ]})
        } else {
          this.antTerminal = this.vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars, shellPath: this.ansiconExe})
        }
      } else {
        if (this.useWinColorLogger) {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.WinColorLogger'
        } else if (process.platform !== 'win32') {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.AnsiColorLogger'
        }

        this.antTerminal = this.vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars}) // , shellPath: 'C:\\WINDOWS\\System32\\cmd.exe' })
      }

      this.antTerminal.sendText(`cd "${this.rootPath}"`)

      // send an initialise command?
      if (this.initialiseCommand) {
        this.antTerminal.sendText(`${this.initialiseCommand}`)
      }
    }

    // pass triggering filename into script
    let extraParams = ''
    if (triggerFile) {
      extraParams = ` -DautoTargetTriggerFilename="${triggerFile}"`
    }

    if (buildFile && buildFile !== 'build.xml') {
      this.antTerminal.sendText(`${this.antExecutable}${extraParams} -buildfile ${buildFile} ${targets}`)
    } else {
      this.antTerminal.sendText(`${this.antExecutable}${extraParams} ${targets}`)
    }

    this.antTerminal.show(true)
  }

  revealDefinition (target) {
    this.vscode.workspace.openTextDocument(fileHelper.getRootFile(this.rootPath, target.sourceFile))
      .then((document) => {
        return this.vscode.window.showTextDocument(document)
      })
      .then((textEditor) => {
        // find the line
        let text = textEditor.document.getText()
        let regexp = new RegExp('target[.\\s]+name[\\s]*=["\']' + target.name + '["\']', 'gm')
        let offset = regexp.exec(text)
        if (offset) {
          let position = textEditor.document.positionAt(offset.index)
          textEditor.revealRange(new this.vscode.Range(position, position), this.vscode.TextEditorRevealType.InCenter)
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
