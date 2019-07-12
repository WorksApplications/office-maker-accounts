const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: 'development',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: __dirname,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
      },
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts'],
    alias: {
      "@": path.resolve(__dirname, "src/")
    },
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  },
};
