# Ant Target Runner for Visual Studio Code

An ant extension that parses build.xml in the root directory (but you can conifgure it to look eleswhere) and allows you to easily run the targets or reveal their definitions.
Ant build output can be colorized, environment variables can be set and targets can be automatically run on changes in the file system.

## Features

- Bundled Ant 1.10.7 with a windows colour library by Dennis Lang (http://landenlabs.com/android/ant-color-logger/index.html).
- Searches for build.xml in the root directory (but you can configure it to look eleswhere) on startup and loads the targets ready to run.
- The targets and their dependencies are visualised in a treeview and can be run from the toolbar or the context menu option.
- Dependencies of dependencies are shown recursively to give a full picture of what will be run and in which order.
- Targets can be sorted as they appear in the file or in alphabetical order.

![It works like this](/resources/demo.gif "It works like this")

- Will detect changes, creates and deletes of the build.xml file and reload the target list automatically.

![Change tracking](/resources/tracking.gif "Change tracking")

- Reveal target line definition in build.xml.

![Reveal definition](/resources/reveal.gif "Reveal definition")

- Colorized ant output on windows using built in Ant with Dennis Langs ant color logger (http://landenlabs.com/android/ant-color-logger/index.html) or using ansicon (https://github.com/adoxa/ansicon).

![Reveal definition](/resources/ansicon.gif "Colorized output")

- Auto targets allow targets to be run on file system changes with configurable delay.

![Reveal definition](/resources/autotarget.gif "Auto targets")

- Will load env vars from build.env (configurable) and pass them into ant.

## Requirements

For this release the extension requires:
- Ant version 1.10.7 is now bundled with the extension but you can also point the extension at an existing ant install (using `ant.executable` and `ant.home`).
- By default your ant build xml file should be in the root directory and be called build.xml but you can conifgure it to look eleswhere.
- By default any environment variables file should be in the root directory and be called build.env but you can conifgure it to look eleswhere.
- By default any auto target file should be in the root directory and be called build.auto but you can conifgure it to look eleswhere.

## Extension Settings & Configuration files

This extension contributes the following settings:

* `ant.executable`: the executable for ant. Default is ant.
* `ant.home`: if set will set ANT_HOME env in terminal to this value. Default is blank.
* `ant.sortTargetsAlphabetically`: should the targets be sorted alphabetically by default? Default is true.
* `ant.envVarsFile`: file name to load env vars from to pass to ant. Default is build.env.
* `ant.ansiconExe`: Ansicon executable (e.g. D:/tools/ansicon/ansicon.exe) for colorization on windows. Download from (https://github.com/adoxa/ansicon/releases).
* `ant.buildFilenames`: comma separated list of build file names to load. Default is build.xml.
* `ant.buildFileDirectories`: comma separated list of directories to search for configured file names (build, auto & env files). Default is . .
* `ant.buildAutoFile`: comma separated list of file names to load auto targets from. Default is build.auto.
* `ant.initialiseCommandOnWin32`: command to call when new output console is initialised on win32 platform.
* `ant.initialiseCommandOnLinux`: command to call when new output console is initialised on linux platform.

The extension will use the built in version of Ant which includes a windows colour library if you don't configure the ant.executable or ant.home settings.

The build.env (or whatever is configured) should be in standard property file format like this:
```
ENV_VAR1=my setting
ENV_VAR2=C:\some\path
```

The autoTarget file build.auto (or whatever is configured) should be in the json format below:
```json
{
  "autoTargets": [
    {
      "filePattern": "src/foldertest/**/*.{p,w,i,cls}",
      "buildFile": "build.xml",
      "runTargets": "compile_foldertest",
      "initialDelayMs": 1000
    },
    {
      "filePattern": "**/*.{p,w,i,cls}",
      "buildFile": "build.xml",
      "runTargets": "compile",
      "initialDelayMs": 1000
    },
    {
      "filePattern": "**/*.test",
      "buildFile": "build.xml",
      "runTargets": "compile test",
      "initialDelayMs": 5000
    },
    {
      "filePattern": "**/*.spacetest",
      "buildFile": "build.xml",
      "runTargets": "\"space test\" test",
      "initialDelayMs": 2000
    }
  ]
}
```

## Release Notes

New initialise command that will execute whenever a new terminal window is created.
I'm using this myself to call 'chcp 65001' to set windows code page to UTF-8 so I can get tick marks in my ablunit output.

Updated dependencies based on Github security reports.

## [0.2.2] - 2020-08-17
### Added
- Initialise command that is run when a new terminal window is created.

### Fixed
- Updated dependencies based on Github security reports.

## [0.2.1] - 2020-05-05
### Fixed
- Extension missing README etc

## [0.2.0] - 2020-05-05
### Added
- Use webpack to bundle extension.
- Bundle Ant 1.10.7 with windows colour library by Dennis Lang.
- Configurable build file directories.
- Configurable build file names.
- Support for imported build targets.
- Prefix window messages with ATR:.
