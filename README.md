# Ant Target Runner for Visual Studio Code

An ant extension that parses build.xml in the root directory (but you can configure it to look elsewhere) and allows you to easily run the targets or reveal their definitions.
Ant build output can be colorized, environment variables can be set and targets can be automatically run on changes in the file system.

## Features

- Bundled Ant 1.10.7 with a windows colour library by Dennis Lang (http://landenlabs.com/android/ant-color-logger/index.html).
- Searches for build.xml in the root directory (but you can configure it to look elsewhere) on startup and loads the targets ready to run.
- Build file is parsed using Ant executable for accurate parsing results (there is a fallback basic parser if this gives you issues).
- Supports multi-folder workspaces by scanning each folder in turn looking for build files.
- The targets and their dependencies are visualised in a treeview and can be run from the toolbar or the context menu option.
- Dependencies of dependencies are shown recursively to give a full picture of what will be run and in which order.
- Targets can be sorted as they appear in the file or in alphabetical order.
- NOTE: this version now uses the ant executable to parse the build file by default so that it can resolve imports. To revert to previous behaviour set `ant.useAntForParsing` to false.

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
- By default your ant build xml file should be in the root directory and be called build.xml but you can configure it to look elsewhere.
- By default any environment variables file should be in the root directory and be called build.env but you can configure it to look elsewhere.
- By default any auto target file should be in the root directory and be called build.auto but you can configure it to look elsewhere.

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
* `ant.useAntForParsing`: Use ant command line to parse the build file. If set to false then an internal parser is used instead which is comparatively limited.

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

Parser was failing if targets had regex characters in them. They are now escaped before checking for a match.

## [0.4.2] - 2022-10-14
### Fixed
- Fixed issue with parsing targets with regex characters in them.

## [0.4.1] - 2022-10-10
### Fixed
- Release through linux so that ant stays executable.
- Detect changes of use ant for parsing so that a restart isn't needed.

## [0.4.0] - 2022-10-08
### Added
- Now uses ant to parse the build file by default.
- Report build file issues to user via notification.

### Fixed
- Remove blank command which was failing with VSCode 1.72.0.
- Fixed all dependency audits.

## [0.3.3] - 2022-05-30
### Fixed
- Fix double quotes on targets with spaces.

## [0.3.2] - 2022-03-08
### Fixed
- Updated dependencies based on Github security reports.

## [0.3.1] - 2021-03-22
### Fixed
- Fix security audits.
- Fix cd command for folders with spaces in to use quotes.
