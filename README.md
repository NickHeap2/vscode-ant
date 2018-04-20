# Ant Target Runner for Visual Studio Code

A simple ant extension that parses build.xml in the root directory and allows you to easily run the targets or reveal their definitions.

## Features

- Searches for build.xml in the root directory on startup and loads the targets ready to run.
- The targets and their dependencies are visualised in a treeview and can be run from the toolbar or the context menu option.
- Dependencies of dependencies are shown recursively to give a full picture of what will be run and in which order.
- Targets can be sorted as they appear in the file or in alphabetical order.

![It works like this](/resources/demo.gif "It works like this")

- Will detect changes, creates and deletes of the build.xml file and reload the target list automatically.

![Change tracking](/resources/tracking.gif "Change tracking")

- Will load env vars from build.env (configurable) and pass them into ant.

![Reveal definition](/resources/reveal.gif "Reveal definition")

- Reveal target line definition in build.xml.

## Requirements

For this release the extension requires that your ant build xml file be in the root directory and be called build.xml.

## Extension Settings

This extension contributes the following settings:

* `ant.executable`: the executable for ant. Default is ant.
* `ant.home`: if set will set ANT_HOME env in terminal to this value. Default is blank.
* `ant.sortTargetsAlphabetically`: should the targets be sorted alphabetically by default? Default is true.
* `ant.envVarsFile`: file name to load env vars from to pass to ant. Default is build.env.

## Known Issues

Only works for build.xml in the root folder at the moment.

## Release Notes

Fixed the behaviour when starting with a workspace with no folders. Changed the activation of the extension to be when the view is first opened. Added toolbar button to run the currently selected target.

## [0.0.7] - 2018-04-20
### Added
- Add reveal target line definition.
