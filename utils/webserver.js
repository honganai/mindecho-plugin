// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';
// process.env.API_URL = 'http://localhost:8000';
// process.env.API_URL = 'https://api.mindecho.app'
// process.env.API_URL = 'https://pr.hongan.live';
process.env.API_URL = 'https://me.hongan.live';
process.env.POSTHOG_KEY = 'phc_hUcXh8vBONcqDx2Z2SyLpa76IpVhnFnpUOhXBfdPaeP';

const fs = require('fs');

var WebpackDevServer = require('webpack-dev-server'),
  webpack = require('webpack'),
  config = require('../webpack.config'),
  env = require('./env'),
  path = require('path');

var options = config.chromeExtensionBoilerplate || {};
var excludeEntriesToHotReload = options.notHotReload || [];

for (var entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?hot=false&hostname=localhost&port=${env.PORT}`,
    ].concat(config.entry[entryName]);
  }
}

delete config.chromeExtensionBoilerplate;

var compiler = webpack(config);

var server = new WebpackDevServer(
  {
    // https: true, // 删除此行
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'cert', 'localhost+2-key.pem')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'cert', 'localhost+2.pem')),
    // },
    hot: false,
    liveReload: false,
    client: {
      overlay: false,
      webSocketTransport: 'ws',
      // webSocketTransport: 'sockjs',
    },
    // webSocketServer: 'sockjs',
    webSocketServer: 'ws',
    // webSocketServer: false,
    host: 'localhost',
    port: env.PORT,
    static: {
      directory: path.join(__dirname, '../build'),
    },
    devMiddleware: {
      publicPath: `http://localhost:${env.PORT}/`,
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all',
  },
  compiler,
);

(async () => {
  await server.start();
})();
