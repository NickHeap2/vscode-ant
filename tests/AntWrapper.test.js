const context = {
  subscriptions: [],
  extensionPath: '.'
}

const vscode = {
  workspace: {
    onDidChangeConfiguration: jest.fn(),
    getConfiguration: jest.fn()
  }
}

//#region testData
const expectedData = {
  project: {
    $: {
      name: "Test project name",
      default: "default"
    },
    target: [
      {
        $: {
          name: "default",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          depends: "clean, compile, test, dist"
        }
      },
      {
        $: {
          name: "fold space",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          description: "Fold space"
        }
      },
      {
        $: {
          name: "dlc",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          description: "Show dlc!"
        }
      },
      {
        $: {
          name: "clean",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          description: "Clean all the things!"
        }
      },
      {
        $: {
          name: "start_databases",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml"
        }
      },
      {
        $: {
          name: "compile",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          depends: "start_databases"
        }
      },
      {
        $: {
          name: "compile_foldertest",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          depends: "start_databases"
        }
      },
      {
        $: {
          name: "test",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          depends: "compile"
        }
      },
      {
        $: {
          name: "dist",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          depends: "compile, test"
        }
      },
      {
        $: {
          name: "output_test",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml"
        }
      },
      {
        $: {
          name: "more targets with dependency",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\build.xml",
          depends: "more targets target"
        }
      },
      {
        $: {
          name: "macrodefTarget",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\macrodefs.xml"
        }
      },
      {
        $: {
          name: "more targets target",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\targets.xml",
          description: "More Targets"
        }
      },
      {
        $: {
          name: "new one",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test\\nestedFolder\\anotherlevel.xml",
          description: "Looooooooooooooooooooooooooooooooooooong5 desc"
        }
      }
    ]
  }
}
//#endregion testData

const AntWrapper = require("../src/AntWrapper")

describe('AntWrapper', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('should be able to spawn ant and get logs', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({ get: jest.fn() })

    const antWrapper = new AntWrapper(vscode, context)
    expect(antWrapper.antExecutable).toBe('ant.bat')
    expect(antWrapper.antHome).toBe('dist\\apache-ant')
    const antData = await antWrapper.spawnAnt('test/build.xml')
    expect(antData).toContain('Apache Ant')
    expect(antData).toContain('parsing buildfile')
    expect(antData).toContain('Default target:')
  })

  test('should be able to parse a build file', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({ get: jest.fn() })

    const antWrapper = new AntWrapper(vscode, context)
    const antData = await antWrapper.spawnAnt('test/build.xml')

    const parsedData = antWrapper.parseAntData(antData)
    expect(parsedData).toStrictEqual(expectedData)
  })

  test('should be able to parse a file with vars in', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({ get: jest.fn() })

    const antWrapper = new AntWrapper(vscode, context)
    expect(antWrapper.antExecutable).toBe('ant.bat')
    expect(antWrapper.antHome).toBe('dist\\apache-ant')
    const antData = await antWrapper.spawnAnt('test_with_vars/build.xml')
    expect(antData).toContain('Apache Ant')
    expect(antData).toContain('parsing buildfile')
    expect(antData).toContain('Default target:')
  })
})
