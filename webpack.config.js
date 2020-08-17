'use strict'

const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  entry: './src/extension.js', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CopyPlugin({patterns: [
      {
        from: 'resources',
        to: 'resources',
        globOptions: {
          ignore: ['*.gif', 'sshot.png']
        }
      },
      {
        from: 'apache-ant',
        to: 'apache-ant',
        globOptions: {
          ignore: ['manual/**']
        }
      }
    ]})
  ]
}

module.exports = config
