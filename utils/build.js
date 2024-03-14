// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';
// process.env.API_URL = 'https://linnk.distil.la'
// process.env.API_URL = 'https://linnk.hongan.live'
// !!!!!!!!!!!!    build.js 中为生产使用 谨慎修改    !!!!!!!!!!!!!!!!!!!
process.env.API_URL = 'https://app.linnk.ai'
process.env.POSTHOG_KEY = 'phc_opatROyYsdsv93fTRhj6l6vChu8PG21NsMRZoMsAoaJ';

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
