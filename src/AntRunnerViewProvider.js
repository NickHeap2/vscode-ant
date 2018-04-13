const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

module.exports = class AntRunnerViewProvider {
  constructor (rootPath) {
    this.rootPath = rootPath

    this._parser = new xml2js.Parser()
  }

  getTreeItem (element) {
    return element
  }

  getChildren (element) {
    if (!this.rootPath) {
      vscode.window.showInformationMessage('No build.xml in empty workspace.')
      return new Promise((resolve, reject) => {
        resolve([])
        reject(new Error('Failed somehow'))
      })
    }

    return new Promise((resolve, reject) => {
      if (element) {
        reject(new Error('It is empty!'))
        // resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')))
      } else {
        const buildXml = path.join(this.rootPath, 'build.xml')
        if (this.pathExists(buildXml)) {
          this.getTargetsInBuildXml(buildXml)
            .then((targets) => {
              resolve(targets)
            })
            .catch((err) => {
              // reject(new Error(err))
              console.log(err)
              resolve([])
            })
        } else {
          vscode.window.showInformationMessage('Workspace has no build.xml.')
          resolve([])
        }
      }
    })
  }

  getTargetsInBuildXml (buildXml) {
    return new Promise((resolve, reject) => {
      fs.readFile(buildXml, 'utf-8', (err, data) => {
        if (err) {
          vscode.window.showInformationMessage('Error reading build.xml!')
          reject(new Error('Error reading build.xml!: ' + err))
        }
        this._parser.parseString(data, (err, result) => {
          if (err) {
            vscode.window.showInformationMessage('Error parsing build.xml!')
            reject(new Error('Error parsing build.xml!:' + err))
          }
          vscode.window.showInformationMessage('We have the build.xml!')

          var targets = result.project.target.map((target) => {
            return {
              label: target.$.name,
              collapsibleState: false,
              command: null,
              contextValue: 'antTarget',
              depends: target.$.depends
            }
          })

          resolve(targets)
        })
      })
    })
  }

  pathExists (p) {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }

    return true
  }

  runAntTask (context) {
    console.log(context)
  }
}
