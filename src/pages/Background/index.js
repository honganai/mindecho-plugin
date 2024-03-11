/* eslint-disable no-undef */
import _ from 'lodash';
import Api from './api';
import { sendsocketMessage, connect, disconnect } from './ws';
import { baseUrl, welcomeUrl } from './config';
import ReadingTime from './readingTime';
import { EXCLUDE_URLS, setExtensionUpdated } from '@/constants';

chrome.runtime.onMessage.addListener(handleMessages);
chrome.action.onClicked.addListener(handleActiveClick);

const css = `
html {
    width: calc(100% - 450px) !important;
    position: relative !important;
    min-height: 100vh !important;
}`;

/**
 * 点击插件logo，开始注入content
 * @param {} tab
 */
async function handleActiveClick(tab) {
  // 检查是否是需要排除的网址
  if (EXCLUDE_URLS.some((url) => tab.url.indexOf(url) !== -1)) return false;
  console.log('chrome.action.onClicked', tab);
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      window.contentLoaded = false;
    },
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['contentScript.bundle.js'],
  });

  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: css,
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
            if (filterUrl.length > 0) {
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

async function onLogoutAction(message, sender, sendResponse) {
  chrome.cookies.remove({ url: baseUrl, name: 'session' }, (cookie) => {
    console.log('remove cookie:', cookie);
    sendResponse({
      message: 'logout ok',
    });
    setLogin(true);
  });
}

function handleMessages(message, sender, sendResponse) {
  console.log('message:', message, 'sender:', sender);
  const { type } = message;
  if (type === 'login') {
    onLoginAction(message, sendResponse);
  } else if (type === 'logout') {
    onLogoutAction(message, sender, sendResponse);
  } else if (type === 'request') {
    onRequest(message, sendResponse);
  } else if (type === 'setCookie') {
    setCookie(message, sender, sendResponse);
  } else if (type === 'getCookie') {
    getCookie(message, sender, sendResponse);
  } else if (type === 'close') {
    onClose(sender, sendResponse);
  } else if (_.startsWith(type, 'ws_')) {
    sendsocketMessage(type, message, sender, sendResponse);
  } else if (type === 'showContent') {
    onShowContent(message, sender, sendResponse);
  } else if (type === 'getPageTitles') {
    onGetPageTitles(message, sender, sendResponse);
  } else if (type === 'readBookMark') {
    console.log('handleMessages readBookMark');
    // chrome.bookmarks.getTree((tree) => {
    //   console.log('tree:', tree);
    // });
    chrome.bookmarks.getRecent(10, (bookmarkTreeNodes) => {
      console.log('bookmarkTreeNodes:', bookmarkTreeNodes);
      for (var i = 0; i < bookmarkTreeNodes.length; i++) {
        console.log('Bookmark: ' + bookmarkTreeNodes[i].title);
      }
    });
  } else if (type === 'showSummary') {
    // 点击图标时请求summary socket
    onSummary(message, sender, sendResponse);
  } else if (type === 'showGoal') {
    // 点击图标时请求summary socket
    chrome.tabs.sendMessage(sender.tab.id, { ...message, sender }, function (res) {
      console.log('send showGoal', res);
      //
    });
    sendResponse('ok');
  } else if (type === 'readingTime') {
    ReadingTime.getInstance({
      tabId: sender.tab.id,
      chrome,
      articleId: message.data.articleId,
      ua: message.data.ua,
    });
  } else if (type === 'disconnect') {
    disconnect();
  }
  return true;
}
// 发送summary
async function onSummary(message, sender, sendResponse) {
  await chrome.tabs.sendMessage(sender.tab.id, { ...message, sender }, function (res) {
    console.log('send showSummary', res);
    //
  });
  sendResponse('ok');
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

function setCookie(message, sender, sendResponse) {
  console.log(message, sender);
  sendResponse({
    cmd: 'setCookie',
    data: 'ok',
  });
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
 * 关闭content页面
 * @param {*} sender
 * @param {*} sendResponse
 */
async function onClose(sender, sendResponse) {
  chrome.scripting.removeCSS({
    target: { tabId: sender.tab.id },
    css: css,
  });
  // await chrome.scripting.executeScript({
  //   target: { tabId: sender.tab.id },
  //   function: () => {
  //     const eleRoot = document.getElementById('pointread-sidebar');
  //     document.body.removeChild(eleRoot);
  //     window.contentLoaded = false;
  //   },
  // });

  // 删除观察对象
  const rt = ReadingTime.getDiretcInstance();
  rt && rt.removeArticleObject(sender.tab.id);
  sendResponse('ok');
}

async function onShowContent(message, sender, sendResponse) {
  console.log('show-content:', message, sender);
  await chrome.scripting.executeScript({
    target: { tabId: sender.tab.id },
    function: () => {
      window.contentLoaded = false;
    },
  });

  await chrome.scripting
    .executeScript({
      target: { tabId: sender.tab.id },
      files: ['contentScript.bundle.js'],
    })
    .catch((e) => {
      console.log('errrrr:', e);
    });

  await chrome.scripting.insertCSS({
    target: { tabId: sender.tab.id },
    css: css,
  });
  console.log({ ...message, sender });
  await chrome.tabs.sendMessage(sender.tab.id, { ...message, sender }, function (res) {
    console.log('send ContentFlat data content script success', res);
    //
  });
  sendResponse('ok');
}

/**
 * onGetPageTitles
 * @param {*} sender
 * @param {*} sendResponse
 */
async function onGetPageTitles(message, sender, sendResponse) {
  let pageTitles = [];
  const tags = await chrome.tabs.query({ active: false, currentWindow: true });
  for (var i = 1; i < tags.length; i++) {
    //第一个标签页是当前标签页 已经在current_title中获取了
    pageTitles.push(tags[i].title);
  }
  //获取当前活跃标签页的标题 不在获取收藏夹内容
  // const bookmarkTreeNodes = await chrome.bookmarks.getRecent(10);
  // for (var i = 0; i < bookmarkTreeNodes.length; i++) {
  //   pageTitles.push(bookmarkTreeNodes[i].title);
  // }
  console.info('onGetPageTitles pageTitles is : ', pageTitles);
  sendResponse(pageTitles);
}

/**
 * localStoregeSet
 * @param {*} sender
 * @param {*} sendResponse
 */
async function localSet(message, sender, sendResponse) {
  chrome.storage.local.set({ key: 'value' }, function () {
    console.log('Value is set to ' + 'value');
  });

  chrome.contextMenus.onClicked({
    title: 'Context Menu',
    contexts: ['page'],
    onclick: function () {
      // alert('You clicked me!');
    },
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == 'popupOpened') {
    chrome.storage.local.set({ key: 'value' }, function () {
      console.log('Value is set to ' + 'value');
    });
  }
});
/**
 * contextmenu
 */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('reason:', reason);
  chrome.contextMenus.create({
    id: 'myContextMenu',
    title: 'Run Analysis',
    type: 'normal',
    contexts:["selection"]
  });
  //暂时不需要新手引导页面
  // if (reason === 'install') {
  //   chrome.tabs.create({
  //     active: true,
  //     url: welcomeUrl
  //   })
  // }
  // if (reason === 'update') {
  //   setExtensionUpdated();
  // }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log(info);
  console.log(tab);
  chrome.storage.local.set({ selectionText: info.selectionText }, function () {
    console.log('text is ' + info.selectionText);
  });
});
