# Change Log
Run target was failing if a target name had brackets in but no spaces.

## [0.4.3] - 2022-10-14
### Fixed
- Fixed issue targets with brackets in not being surrounded by quotes.

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

## [0.3.0] - 2020-08-30
### Added
- Better support multi-folder workspaces by checking them in order for build files.

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

## [0.1.6] - 2019-07-02
### Added
- Update dependencies.

## [0.1.5] - 2019-07-02
### Fixed
- Fixed error where space separated auto targets are surrounded by quotes.

## [0.1.4] - 2019-06-17
### Fixed
- Fixed error where console wouldn't launch if terminal.integrated.shell.windows is null.

## [0.1.3] - 2018-12-09
### Fixed
- Fixed error on running target when an env var file is defined but doesn't exist.

## [0.1.2] - 2018-08-16
### Added
- Update vscode to fix vulnerability.

## [0.1.1] - 2018-08-03
### Added
- Update dependencies.

### Fixed
- Fixed calling ant build on targets that have spaces in the name (pull request from katoun).

## [0.1.0] - 2018-04-28
### Added
- Refactored most code.
- Auto run triggering via build.auto file with configurable delay to prevent duplicates.

### Fixed
- Don't change focus to terminal on target run.

## [0.0.8] - 2018-04-23
### Added
- Add ansicon support for windows (https://github.com/adoxa/ansicon) to colorize output.

## [0.0.7] - 2018-04-20
### Added
- Add reveal target line definition.

## [0.0.6] - 2018-04-15
### Fixed
- Correct docs for config name.
- Fix context menu run.

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