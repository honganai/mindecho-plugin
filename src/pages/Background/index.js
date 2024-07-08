/* eslint-disable no-undef */
import _ from 'lodash';
import Api from './api';
import { sendsocketMessage, connect, disconnect } from './ws';
import { baseUrl, welcomeUrl } from './config';
import ReadingTime from './readingTime';
import {
  EXCLUDE_URLS,
  setExtensionUpdated,
  setAutoAdd,
  getIsLogin,
  setIsLogin,
  initPagesInfo,
  setUserInfo,
} from '@/constants';
import { startAutoAdd } from './autoAdd';
import onTwitterAction from './bookmarks/bookmarks';

import './syncXRequestHeader';
initPagesInfo();

chrome.runtime.onInstalled.addListener(() => {
  // 创建一个定时器，每隔6小时触发一次
  const periodInMinutes = 6 * 60;
  // const periodInMinutes = 0.5;
  chrome.alarms.create('autoAddAlarm', { periodInMinutes });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  alarm.name === 'autoAddAlarm' && startAutoAdd();
});

chrome.runtime.onMessage.addListener(handleMessages);
chrome.action.onClicked.addListener(handleActiveClick);
chrome.tabs.onRemoved.addListener(handleRemoveRab);

/**
 * 关闭tab断开websocket
 */
function handleRemoveRab(tabId) {
  disconnect(tabId);
}

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
  } else if (type === 'twitter') {
    onTwitterAction(message, sendResponse);
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
            console.log('🚀 ~ listenOnHeadersReceived ~ details.url:', details.url);
            const domainParts = url.hostname.split('.');
            const topLevelDomain = domainParts.slice(-2).join('.');
            if (details.url === baseUrl + '/') {
              console.log(filterUrl);
              chrome.cookies.getAll({ domain: topLevelDomain, session: true }, function (cookies) {
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
                          setLogin(true, activeTab);
                        }, 1000);
                        setTimeout(() => {
                          console.log('cookieListener activeTab.id:', window.id);
                          setLogin(true, activeTab);
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
  // chrome.storage.local.set({
  //   isLogin: value,
  // });
  setIsLogin(value);
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
  const isLogin = await getIsLogin();
  console.log(isLogin, api, Api, message);
  if (Api[api] && isLogin) {
    console.log(api, message);
    return Api[api](message)
      .then((res) => {
        if (res.status === 401) {
          setLogin(false);
          return;
        } else if (res.status !== 200) {
          //登出后导致接口报错，需要清除登录状态
          setLogin(false);
          setUserInfo(null);
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
    contexts: ['selection'],
  });

  // if (reason === 'install') {
  //   chrome.tabs.create({
  //     active: true,
  //     url: welcomeUrl
  //   })
  // }
  if (reason === 'update') {
    setExtensionUpdated();
  }
  if (reason === 'install') {
    openSettings();
    executeScript();
    setAutoAdd();
  }
  //测试
  // openSettings();
  // executeScript();
});

/**
 * 安装完成后自动注入弹窗
 */
function executeScript() {
  chrome.tabs.query({}, function (tabs) {
    var tabId = tabs[0].id;
    //向当前标签页注入内容脚本
    tabs.forEach((item) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: item.id },
          files: ['contentFlatScript.bundle.js'],
        },
        (res) => {
          console.log('🚀 ~ background.index -脚本注入结果- line:240: ', res);
        },
      );
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log(info);
  console.log(tab);
  chrome.storage.local.set({ selectionText: info.selectionText }, function () {
    console.log('text is ' + info.selectionText);
  });
});
