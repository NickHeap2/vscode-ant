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

const rootPath = './'

const BuildFileParser = require("../src/BuildFileParser")

//#region testData
const expectedDataFromDirect = {
  project: {
    $: {
      name: "Test project name",
      default: "default"
    },
    property: [
      {
        $: {
          environment: "env"
        }
      }
    ],
    import: [
      {
        $: {
          file: "macrodefs.xml"
        }
      },
      {
        $: {
          file: "targets.xml"
        }
      }
    ],
    target: [
      {
        $: {
          name: "default",
          depends: "clean,compile,test,dist"
        }
      },
      {
        $: {
          name: "fold space",
          description: "Fold space"
        },
        echo: [
          {
            $: {
              message: "Folding space..."
            }
          }
        ]
      },
      {
        $: {
          name: "dlc",
          description: "Show dlc!"
        },
        echo: [
          {
            $: {
              message: "${env.DLC}"
            }
          }
        ]
      },
      {
        $: {
          name: "clean",
          description: "Clean all the things!"
        },
        echo: [
          {
            $: {
              message: "All the things are cleaned!"
            }
          }
        ]
      },
      {
        $: {
          name: "start_databases"
        },
        echo: [
          {
            $: {
              message: "Databases are now running."
            }
          }
        ]
      },
      {
        $: {
          name: "compile",
          depends: "start_databases"
        },
        echo: [
          {
            $: {
              message: "All the things are compiled!"
            }
          }
        ]
      },
      {
        $: {
          name: "compile_foldertest",
          depends: "start_databases"
        },
        echo: [
          {
            $: {
              message: "All the foldertest things are compiled!"
            }
          }
        ]
      },
      {
        $: {
          name: "test",
          depends: "compile"
        },
        echo: [
          {
            $: {
              message: "0 test have been run."
            }
          }
        ]
      },
      {
        $: {
          name: "dist",
          depends: "compile,test"
        },
        echo: [
          {
            $: {
              message: "We shipped it!"
            }
          }
        ]
      },
      {
        $: {
          name: "output_test"
        },
        echo: [
          {
            $: {
              message: "This is an error.",
              level: "error"
            }
          },
          {
            $: {
              message: "This is an warning.",
              level: "warning"
            }
          },
          {
            $: {
              message: "This is an info.",
              level: "info"
            }
          },
          {
            $: {
              message: "This is an verbose.",
              level: "verbose"
            }
          },
          {
            $: {
              message: "This is an debug.",
              level: "debug"
            }
          }
        ]
      },
      {
        $: {
          name: "more targets with dependency",
          depends: "more targets target"
        },
        echo: [
          {
            $: {
              message: "This depends on a target in another file."
            }
          }
        ]
      }
    ]
  }
}

const expectedDataFromAnt = {
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

const expectedDataFromAntWithVars = {
  project: {
    $: {
      name: "Test target names",
      default: "d-target"
    },
    target: [
      {
        $: {
          name: "d-targetmore",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test_with_vars\\build.xml",
          description: "Check substring",
          depends: "d-target"
        }
      },
      {
        $: {
          name: "d-target",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test_with_vars\\build.xml"
        }
      },
      {
        $: {
          name: "a-target",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test_with_vars\\build-import.xml",
          description: "Desc1 with more spaces"
        }
      },
      {
        $: {
          name: "b-target",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test_with_vars\\build-import.xml"
        }
      },
      {
        $: {
          name: "c-target",
          sourceFile: "S:\\Workspaces\\vscode-ant\\test_with_vars\\build-import.xml",
          depends: "b-target, a-target"
        }
      }
    ]
  }
}

//#endregion testData

describe('BuildFileParser', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('should be able to parse file direct', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({ get: jest.fn()
      .mockReturnValueOnce( undefined )
      .mockReturnValueOnce( undefined )
      .mockReturnValueOnce( false )
    })

    const buildFileParser = new BuildFileParser(vscode, context, rootPath)
    const result = await buildFileParser.parseBuildFile('test/build.xml')
    expect(result).toStrictEqual(expectedDataFromDirect)
  })

  test('should be able to parse file using ant', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({ get: jest.fn()
      .mockReturnValueOnce( undefined )
      .mockReturnValueOnce( undefined )
      .mockReturnValueOnce( true )
    })

    const buildFileParser = new BuildFileParser(vscode, context, rootPath)
    const result = await buildFileParser.parseBuildFile('test/build.xml')
    expect(result).toStrictEqual(expectedDataFromAnt)
  })

  test('should be able to parse file with vars using ant', async () => {
    vscode.workspace.getConfiguration.mockReturnValue({ get: jest.fn()
      .mockReturnValueOnce( undefined )
      .mockReturnValueOnce( undefined )
      .mockReturnValueOnce( true )
    })

    const buildFileParser = new BuildFileParser(vscode, context, rootPath)
    const result = await buildFileParser.parseBuildFile('test_with_vars/build.xml')
    console.log(JSON.stringify(result, null, 2))
    expect(result).toStrictEqual(expectedDataFromAntWithVars)
  })
})
