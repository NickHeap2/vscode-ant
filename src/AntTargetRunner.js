const vscode = require('vscode')
const dotenv = require('dotenv')
const filehelper = require('./filehelper')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

var extensionContext

module.exports = class AntTargetRunner {
  constructor (context) {
    extensionContext = context
    this.autoTargetRunner = null

    const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this))
    extensionContext.subscriptions.push(onDidChangeConfiguration)

    // target runner needs to know when the terminal closes
    const terminalClosed = vscode.window.onDidCloseTerminal(this.terminalClosed.bind(this))
    context.subscriptions.push(terminalClosed)
  }

  setWorkspaceFolder (workspaceFolder) {
    this.rootPath = workspaceFolder

    this.getConfigOptions()
  }

  onDidChangeConfiguration () {
    this.getConfigOptions()
  }

  async getConfigOptions () {
    let configOptions = vscode.workspace.getConfiguration('ant', null)
    this.envVarsFile = configOptions.get('envVarsFile', 'build.env')
    this.ansiconExe = configOptions.get('ansiconExe', '')

    if (process.platform === 'win32') {
      this.initialiseCommand = configOptions.get('initialiseCommandOnWin32', '')
    } else {
      this.initialiseCommand = configOptions.get('initialiseCommandOnLinux', '')
    }

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
      // if (!filehelper.pathExists(this.antExecutable) && filehelper.pathExists(this.antHome)) {
      //   const joinedPath = path.join(this.antHome, 'bin', this.antExecutable)
      //   if (filehelper.pathExists(joinedPath)) {
      //     this.antExecutable = '"' + joinedPath + '"'
      //   }
      // }
    }

    // enable WinColorLogger?
    if (process.platform === 'win32' && filehelper.pathExists(this.antHome)) {
      this.useWinColorLogger = filehelper.pathExists(path.join(this.antHome, 'lib', 'WinColorLogger.jar'))
    }

    this.buildFileDirectories = configOptions.get('buildFileDirectories', '.')
    if (this.buildFileDirectories === '' || typeof this.buildFileDirectories === 'undefined') {
      this.buildFileDirectories = '.'
    }

    if (this.envVarsFile === '' || typeof this.envVarsFile === 'undefined') {
      this.envVarsFile = 'build.env'
    }

    try {
      this.envVarsFile = await filehelper.findfirstFile(this.rootPath, this.buildFileDirectories.split(','), this.envVarsFile.split(','))
    } catch (error) {
      // it's fine if this doesn't exist
    }

    if (this.antTerminal) {
      this.antTerminal.dispose()
      this.antTerminal = null
    }
  }

  runAntTarget (context) {
    if (!context) {
      return
    }

    const targets = context.name
    const buildFile = context.sourceFile

    if (!this.antTerminal) {
      this.antTerminal = _.find(vscode.window.terminals, (o) => {
        if (o.name === 'Ant Target Runner') {
          return true
        }
        return false
      })
    }

    if (!this.antTerminal) {
      var envVars = {}
      if (this.envVarsFile && filehelper.pathExists(filehelper.getRootFile(this.rootPath, this.envVarsFile))) {
        envVars = dotenv.parse(fs.readFileSync(filehelper.getRootFile(this.rootPath, this.envVarsFile)))
      }

      if (this.antHome) {
        envVars.ANT_HOME = this.antHome
      }

      // add ant to path?
      if (!filehelper.pathExists(this.antExecutable) && filehelper.pathExists(this.antHome)) {
        const joinedPath = path.join(this.antHome, 'bin')
        if (filehelper.pathExists(joinedPath)) {
          if (process.platform === 'win32') {
            envVars.Path = process.env.Path + ';' + joinedPath
          } else {
            envVars.Path = process.env.Path + ':' + joinedPath
          }
        }
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
        if (this.useWinColorLogger) {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.WinColorLogger'
        } else if (process.platform !== 'win32') {
          envVars.ANT_ARGS = ' -logger org.apache.tools.ant.listener.AnsiColorLogger'
        }

        this.antTerminal = vscode.window.createTerminal({name: 'Ant Target Runner', env: envVars}) // , shellPath: 'C:\\WINDOWS\\System32\\cmd.exe' })
      }

      this.antTerminal.sendText(`cd ${this.rootPath}`)

      // send an initialise command?
      if (this.initialiseCommand) {
        this.antTerminal.sendText(`${this.initialiseCommand}`)
      }
    }

    if (buildFile && buildFile !== 'build.xml') {
      this.antTerminal.sendText(`${this.antExecutable} -buildfile ${buildFile} ${targets}`)
    } else {
      this.antTerminal.sendText(`${this.antExecutable} ${targets}`)
    }

    this.antTerminal.show(true)
  }

  terminalClosed (terminal) {
    if (terminal.name === this.antTerminal.name) {
      this.antTerminal.dispose()
      this.antTerminal = null
    }
  }
}
