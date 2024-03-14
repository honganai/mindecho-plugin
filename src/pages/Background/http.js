/* eslint-disable no-undef */
import { baseUrl } from './config';
const publicHeaders = {
  'Content-Type': 'application/json',
}

const sendError = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
    // 在回调函数中处理返回的标签页信息
    var activeTab = tabs[0];
    activeTab && chrome.tabs.sendMessage(activeTab.id, 'http-error')
  })
}

const TIMEOUT = 180000; // 设置超时时间为120秒

const request = (url, config) => {
  return Promise.race([
    fetch(url, config)
      .then((res) => {
        if (!res.ok && res.status !== 401) {
          sendError();
        }
        return res;
      }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), TIMEOUT)
    )
  ]).catch((error) => {
    sendError();
    return Promise.reject(error);
  });
};
function getUrl(url, params) {
  const url1 = new URL(`${baseUrl}${url}`);
  if (params.q) {
    // TODO 暂时只处理这一个get参数，其他参数是否需要都这样处理？
    params.q = JSON.stringify(params.q)
  }
  url1.search = new URLSearchParams(params).toString();
  return url1
}
export default {
  get: (url, params = {}, headers = {}) => {
    return request(getUrl(url, params), {
      method: 'GET',
      headers,
    });
  },

  delete: (url, params = {}, headers = {}) =>
    request(getUrl(url, params), {
      method: 'DELETE',
      params,
      headers,
    }),

  put: (url, body, params = {}, headers = {}) =>{
    if (!headers['Content-Type']){
      headers['Content-Type'] = 'application/json'
    }
    return request(getUrl(url, params), {
      method: 'PUT',
      params,
      body,
      headers,
    })
  },

  post: (url, body, params = {}, headers = {}) => {
    return request(getUrl(url, params), {
      method: 'POST',
      params,
      body: JSON.stringify(body),
      headers:{ ...publicHeaders, ...headers},
    })
  },
};
