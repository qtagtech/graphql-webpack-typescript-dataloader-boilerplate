const webpack = require('webpack');
const path = require('path');
const clone = require('js.clone');
const webpackMerge = require('webpack-merge');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TypedocWebpackPlugin = require('typedoc-webpack-plugin');
// const DashboardPlugin = require('webpack-dashboard/plugin');
export let commonPlugins = [
  // Loader options
  new webpack.LoaderOptionsPlugin({
  }),
];
export let commonConfig = {
  // https://webpack.github.io/docs/configuration.html#devtool
  devtool: 'source-map',
  resolve: {
    extensions: [ '.ts', '.js', '.json' ],
    modules: [ root('node_modules') ]
  },
  context: __dirname,
  output: {
    publicPath: '',
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      // TypeScript
      { test: /\.ts$/,   use: [ 'awesome-typescript-loader' ] },
      { test: /\.pug$/, use: 'pug-loader' },
      { test: /\.html$/, use: 'raw-loader' },
      { test: /\.css$/,  use: 'raw-loader' },
      { test: /\.json$/, use: 'json-loader' }
    ],
  },
  plugins: new Array<any>()
};
// Server.

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter((x: any) => {
    return [ '.bin' ].indexOf(x) === -1;
  })
  .forEach( (mod: any) => {
    nodeModules[mod] = 'commonjs ' + mod;
  });

  let copyToDistTasks = [
      // Copy assets contents to {dist}/public/assets/
      { from: root('src/assets'), to: root('dist/public/assets') },
      { from: root('config'), to: root('dist/config') },
    ];
  let serverPlugins: Array<any> = [
    new CopyWebpackPlugin(copyToDistTasks,
    {
      ignore: [
          // Doesn't copy any files with a txt, md extension
          '*.txt',
          '*.md'
      ],

      // By default, we only copy modified files during
      // a watch or webpack-dev-server build. Setting this
      // to `true` copies all files.
            copyUnmodified: true
        }),
        // new DashboardPlugin(),
  ];
export let serverConfig = {
  target: 'node',
  entry: [ root('src/index') ],
  output: {
    path: root('dist/index'),
    filename: 'graphql-server.js',
    libraryTarget: 'commonjs2'
  },
  externals : nodeModules,
  node: {
    global: true,
    crypto: true,
    __dirname: true,
    __filename: true,
    process: true,
    Buffer: true
  }
};
export default [
  // Client
  webpackMerge(clone(commonConfig), serverConfig, { plugins: serverPlugins.concat(commonPlugins) }),
];
// Helpers
export function includeClientPackages(packages: any, localModule?: string[]) {
  return function(context: any, request: any, cb: Function) {
    if (localModule instanceof RegExp && localModule.test(request)) {
      return cb();
    }
    if (packages instanceof RegExp && packages.test(request)) {
      return cb();
    }
    if (Array.isArray(packages) && packages.indexOf(request) !== -1) {
      return cb();
    }
    if (!path.isAbsolute(request) && request.charAt(0) !== '.') {
      return cb(null, 'commonjs ' + request);
    }
    return cb();
  };
}
export function root(args: any) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [ __dirname ].concat(args));
}