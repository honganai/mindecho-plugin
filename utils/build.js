// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';
// !!!!!!!!!!!!    build.js 中为生产使用 谨慎修改    !!!!!!!!!!!!!!!!!!!
process.env.API_URL = 'https://api.pointread.app'
process.env.POSTHOG_KEY = 'phc_PSM3JZG2Ti7DlJmhIuHMHWFsLtdZmWUOb2SEhCXnnPc';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  }),
);

webpack(config, function (err) {
  if (err) throw err;
});
