# Change Log
All notable changes to the "vscode-ant" extension will be documented in this file.

## [0.0.5] - 2018-04-15
### Added
- Pass env vars from build.env into terminal (configurable).
- Drop vscode requirement to 1.18.1.

## [0.0.4] - 2018-04-15
### Added
- Run currently selected target from the toolbar.
### Fixed
- Change activation to when view is opened.
- Remove data-tree dependency.
- Fix behaviour when empty workspace is opened.

## [0.0.3] - 2018-04-15
### Added
- Recursively cascade dependencies in tree.
- Allow dependencies to be run.
- Highlight the default target.
- Add project name to root.
### Fixed
- View should be named the same as the extension.

## [0.0.2] - 2018-04-14
### Added
- Refresh command and button to refresh Ant Targets (although this happens automatically anyway).
- Add root node for build.xml file.
- Add target dependencies as children of the target.
- Add simple target and dependency svg.
### Fixed
- Fix terminal closing by name instead of id.

## [0.0.1] - 2018-04-14
### Added
- This is the initial release!