# Ant Target Runner for Visual Studio Code

An ant extension that parses build.xml in the root directory and allows you to easily run the targets or reveal their definitions.
Ant build output can be colorized, environment variables can be set and targets can be automatically run on changes in the file system.

## Features

- Searches for build.xml in the root directory on startup and loads the targets ready to run.
- The targets and their dependencies are visualised in a treeview and can be run from the toolbar or the context menu option.
- Dependencies of dependencies are shown recursively to give a full picture of what will be run and in which order.
- Targets can be sorted as they appear in the file or in alphabetical order.

![It works like this](/resources/demo.gif "It works like this")

- Will detect changes, creates and deletes of the build.xml file and reload the target list automatically.

![Change tracking](/resources/tracking.gif "Change tracking")

- Reveal target line definition in build.xml.

![Reveal definition](/resources/reveal.gif "Reveal definition")

- Colorized ant output on windows using ansicon (https://github.com/adoxa/ansicon).

![Reveal definition](/resources/ansicon.gif "Colorized output")

- Auto targets allow targets to be run on file system changes with configurable delay.

![Reveal definition](/resources/autotarget.gif "Auto targets")

- Will load env vars from build.env (configurable) and pass them into ant.

## Requirements

For this release the extension requires:
- Your ant build xml file should be in the root directory and be called build.xml.
- Any environment variables file should be in the root directory and be called build.env.
- Any auto target file should be in the root directory and be called build.auto.

## Extension Settings & Configuration files

This extension contributes the following settings:

* `ant.executable`: the executable for ant. Default is ant.
* `ant.home`: if set will set ANT_HOME env in terminal to this value. Default is blank.
* `ant.sortTargetsAlphabetically`: should the targets be sorted alphabetically by default? Default is true.
* `ant.envVarsFile`: file name to load env vars from to pass to ant. Default is build.env.
* `ant.ansiconExe`: Ansicon executable (e.g. D:/tools/ansicon/ansicon.exe) for colorization on windows. Download from (https://github.com/adoxa/ansicon/releases).

The build.env should be in standard property file format like this:
```
ENV_VAR1=my setting
ENV_VAR2=C:\some\path
```

The autoTarget file build.auto should be in the json format below:
```json
{
  "autoTargets": [
    {
      "filePattern": "src/foldertest/**/*.{p,w,i,cls}",
      "runTargets": "compile_foldertest",
      "initialDelayMs": 1000
    },
    {
      "filePattern": "**/*.{p,w,i,cls}",
      "runTargets": "compile",
      "initialDelayMs": 1000
    },
    {
      "filePattern": "**/*.test",
      "runTargets": "compile test",
      "initialDelayMs": 5000
    } 
  ] 
}
```

## Known Limitations

Only works for build.xml, build.env & build.auto in the root folder at the moment.

## Release Notes

Updated dependencies to remove security warnings.
Merged pull request from katoun that fixes calling ant build on targets that have spaces in the name.

## [0.1.1] - 2018-08-03
### Added
- Update dependencies.

### Fixed
- Fixed calling ant build on targets that have spaces in the name (pull request from katoun).
