# vscode-ant README

This is a simple ant extension that parses build.xml in the root directory and exposes a list of targets in a treeview.
You can then right click the target and select to execute that target in a terminal named 'Ant Target Runner'.
The terminal session will be reused for future runs.

## Features

Searches for build.xml in the root directory on startup and loads the targets ready to run.

Will detect changes, creates and deletes of the file and reload the target list.

## Requirements

The extension requires that your ant build xml file be in the root directory and be called build.xml.

## Extension Settings

This extension contributes the following settings:

* `ant.executable`: the executable for ant. Default is ant.
* `ant.home`: if set will set ANT_HOME env in terminal to this value. Default is blank.
* `ant.sortTargetsAlphabetically`: should the targets be sorted alphabetically? Default is true.

## Known Issues

Only works for build.xml in the root folder at the moment.

## Release Notes

This is the first release.

### 0.0.1

Initial release for testing.
