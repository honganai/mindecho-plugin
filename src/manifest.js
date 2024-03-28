/* eslint-disable no-undef */
// nodejs module for genernate chrome extension manifest.json
function generChromeExtensionManifest() {
  return {

    manifest_version: 3,
    // 展示build版本与本地dev模式启动的版本差异

    name: process.env.npm_package_name + (process.env.NODE_ENV === 'development' ? '-(dev)' : ''),
    description: process.env.npm_package_description,
    version: process.env.npm_package_version,
    options_page: 'options.html',
    update_url: "https://clients2.google.com/service/update2/crx",
    // key: 'mhbiibphheaiadiilllmfkgeijcgehie',
    background: {
      service_worker: 'background.bundle.js',
      type: 'module',
    },
    // side_panel: {
    //   default_path: "sidepanel.html"
    // },
    permissions: ['scripting', 'readingList', 'history', 'storage',  'cookies',  "bookmarks","unlimitedStorage","contextMenus", "webRequest"],
    host_permissions: ['<all_urls>'],
    action: {
      default_icon: {
        16: 'icon16.png',
        32: 'icon32.png',
        48: 'icon48.png',
        128: 'icon128.png',
      },
    },
    "commands": {
      // 自定义快捷键，最多4个
      // "run-foo": {
      //   "suggested_key": {
      //     "default": "Ctrl+Shift+Y",
      //     "mac": "Command+Shift+Y"
      //   },
      //   "description": "Run \"foo\" on the current page."
      // },
      // 激活插件快捷键，效果和点击插件按钮一样
      "_execute_action": {
        "suggested_key": {
          "default": "Ctrl+E",
          "mac": "Command+E",
        }
      }
    },
    chrome_url_overrides: {
      // 我们暂时不需要new tab页面功能
      // newtab: 'newtab.html',
    },
    icons: {
      16: 'icon16.png',
      32: 'icon32.png',
      48: 'icon48.png',
      128: 'icon128.png',
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        //exclude_matches: ['*://www.baidu.com/*'],
        // all_frames: true,
        // css: ['content.styles.css', 'contentFlatScript.css', 'contentScript.css'],
        // css: ['content.styles.css', 'contentFlatScript.css', 'contentScript.css', 'newtab.css', 'options.css', 'panel.css', 'popup.css', 'sidepanel.css'],
        js: ['contentFlatScript.bundle.js'],
      },
      // {
      //   matches: ['*://www.linnk.ai/*'],
      //   js: ['guide.bundle.js'],
      // },
    ],
    devtools_page: 'devtools.html',
    web_accessible_resources: [
      {
        resources: ['setting.png', 'arrow.png', 'icon128.png', 'logo.png'],
        matches: ['<all_urls>'],
      },
    ],
    default_locale: 'en',

  };
}

module.exports = {
  generChromeExtensionManifest,
};
