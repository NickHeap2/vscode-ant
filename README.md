# Ant Target Runner for Visual Studio Code

This is a simple ant extension that parses build.xml in the root directory and exposes a list of targets and their dependencies in a treeview.
You can then right click the target or dependency and select to run it in a terminal named 'Ant Target Runner'.
The terminal session will be re-used for future runs.

![Running a target](/resources/sshot.png "Running a target")

## Features

- Searches for build.xml in the root directory on startup and loads the targets ready to run.
- Will detect changes, creates and deletes of the build.xml file and reload the target list automatically.
- The targets and their dependencies are visualised in a treeview and can be run from the context menu options.
- Dependencies of dependencies are shown recursively to give a full picture of what will be run and in which order.
- Targets can be sorted as they appear in the file or in alphabetical order.

## Requirements

For this release the extension requires that your ant build xml file be in the root directory and be called build.xml.

## Extension Settings

This extension contributes the following settings:

* `ant.executable`: the executable for ant. Default is ant.
* `ant.home`: if set will set ANT_HOME env in terminal to this value. Default is blank.
* `ant.sortTargetsAlphabetically`: should the targets be sorted alphabetically by default? Default is true.

## Known Issues

Only works for build.xml in the root folder at the moment.

## Release Notes

Added recursive dependencies and allow them to be run. The default target is now shown a different colour to the rest.

## [0.0.3] - 2018-04-15
### Added
- Recursively cascade dependencies in tree.
- Allow dependencies to be run.
- Highlight the default target.
- Add project name to root.
### Fixed
- View should be named the same as the extension.
