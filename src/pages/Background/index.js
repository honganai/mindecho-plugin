/* eslint-disable no-undef */
import _ from 'lodash';
import Api from './api';
import { sendsocketMessage, connect, disconnect } from './ws';
import { baseUrl, welcomeUrl } from './config';
import ReadingTime from './readingTime';
import { EXCLUDE_URLS, setExtensionUpdated } from '@/constants';

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command "${command}" triggered`);
});

chrome.runtime.onMessage.addListener(handleMessages);
chrome.action.onClicked.addListener(handleActiveClick);

function handleMessages(message, sender, sendResponse) {
  console.log('message:', message, 'sender:', sender);
  const { type } = message;
  if (type === 'login') {
    onLoginAction(message, sendResponse);
  } else if (type === 'request') {
    onRequest(message, sendResponse);
  } else if (type === 'getCookie') {
    getCookie(message, sender, sendResponse);
  } else if (_.startsWith(type, 'ws_')) {
    sendsocketMessage(type, message, sender, sendResponse);
  } else if (type === 'openSettings') {
    openSettings();
  }
  return true;
}

/**
 * 打开设置页
 */
export function openSettings() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

/**
 * 点击插件logo，开始注入content
 * @param {} tab
 */
async function handleActiveClick(tab) {
  // readigList获取示例 @王中港
  // chrome.readingList.query({}).then((res) => {
  //   console.log('🚀 ~ chrome.readingList.query ~ res:', res);
  // });

  chrome.tabs.sendMessage(tab.id, { type: 'showAskModal' }, function (res) {
    console.log('send showAskModal', res);
  });
}

async function onLoginAction(message, sendResponse) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    // 在回调函数中处理返回的标签页信息
    var activeTab = tabs[0];
    console.log('activeTab', activeTab);

    chrome.windows.getCurrent(function (currentWindow) {
      var width = 500;
      var height = 600;
      var left = Math.round(currentWindow.width / 2 - width / 2);
      var top = Math.round(currentWindow.height / 2 - height / 2);

      chrome.windows.create(
        {
          url: `${baseUrl}/login/google?next=`,
          type: 'popup',
          width: width,
          height: height,
          left: left,
          top: top,
        },
        function (window) {
          var windowId = window.id;
          function listenOnHeadersReceived(details) {
            const url = new URL(baseUrl);
            // google 登录
            // /oauth-authorized/google
            const loginActionUrls = [baseUrl + '/oauth-authorized/'];
            const filterUrl = _.filter(loginActionUrls, (item) => _.startsWith(details.url, item));
            // if (filterUrl.length > 0) {
            console.log("🚀 ~ listenOnHeadersReceived ~ details.url:", details.url)
            if (details.url === baseUrl + '/') {
              console.log(filterUrl);
              chrome.cookies.getAll({ domain: url.hostname, session: true }, function (cookies) {
                console.log(details.url, cookies);
                _.forEach(cookies || [], (cookie) => {
                  cookie.name === 'session' &&
                    chrome.cookies.set(
                      {
                        url: baseUrl,
                        name: cookie.name,
                        value: cookie.value,
                      },
                      (cookie) => {
                        console.log('Cookie 设置成功:', cookie);
                        chrome.webRequest.onHeadersReceived.removeListener(listenOnHeadersReceived);
                        setTimeout(() => {
                          setLogin(false, activeTab);
                        }, 1000);
                        setTimeout(() => {
                          console.log('cookieListener activeTab.id:', window.id);
                          setLogin(false, activeTab);
                          chrome.windows.remove(windowId);
                        }, 3000);
                      },
                    );
                });
              });
            }
          }
          chrome.webRequest.onHeadersReceived.addListener(listenOnHeadersReceived, { urls: ['<all_urls>'] }, [
            'responseHeaders',
          ]);
        },
      );
    });
  });
}

// 缓存登录state
function setLogin(value, activeTab) {
  chrome.storage.local.set({
    isLogin: value,
  });
  if (activeTab) {
    chrome.tabs.sendMessage(activeTab.id, { isLogin: value, type: 'setLogin' }, function (res) {
      console.log('set login ok');
    });
    return;
  } else {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      // 在回调函数中处理返回的标签页信息
      var activeTab = tabs[0];
      console.log('activeTab', activeTab);
      chrome.tabs.sendMessage(activeTab.id, { isLogin: value, type: 'setLogin' }, function (res) {
        console.log('set login ok');
      });
    });
  }
}

async function onRequest(message, sendResponse) {
  const { api } = message;
  console.log(api, Api, message);
  if (Api[api]) {
    console.log(api, message);
    return Api[api](message)
      .then((res) => {
        if (res.status === 401) {
          // onLoginAction(message, sendResponse);
          setLogin(true);
          return;
        }
        return res.json();
      })
      .then((body) => {
        console.log('request api:', api, body);
        sendResponse(body);
        return;
      })
      .catch((error) => {
        console.log('request error:', api, error);
        sendResponse(error);
      });
  }
  sendResponse({
    cmd: api,
    error: 'method is not exist',
    data: {},
  });
  return;
}

function getCookie(message, sender, sendResponse) {
  let { key, domain } = message;

  chrome.cookies.getAll(
    {
      url: domain || baseUrl,
    },
    (cookies) => {
      console.log('cookies::', cookies);
      let cookie = cookies.find((item) => item.name === key);
      sendResponse({
        cmd: 'getCookie',
        data: cookie,
      });
    },
  );
}

/**
 * contextmenu
 */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('reason:', reason);
  chrome.contextMenus.create({
    id: 'myContextMenu',
    title: 'Test Context Menu',
    type: 'normal',
    contexts:["selection"]
  });
  chrome.runtime.openOptionsPage();
  // if (reason === 'install') {
  //   chrome.tabs.create({
  //     active: true,
  //     url: welcomeUrl
  //   })
  // }
  if (reason === 'update') {
    setExtensionUpdated();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log(info);
  console.log(tab);
  chrome.storage.local.set({ selectionText: info.selectionText }, function () {
    console.log('text is ' + info.selectionText);
  });
});
