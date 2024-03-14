/* eslint-disable no-undef */

import { io } from "socket.io-client";
import { baseUrl } from "./config";
import _ from 'lodash';
// import "./socket.io.min.js";


function getDataFromStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
}

function getCookie(name) {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({url: baseUrl, name: name}, function(cookie) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(cookie.value);
      }
    });
  });
}


let socket = null;
async function connect() {
    const session = await getCookie('session');
    return new Promise((resolve, reject) => {
        if (session) {
          socket = io(baseUrl, {
              withCredentials: true,
              transports: ['websocket'],
              auth: {
                session: session
              },
              extraHeaders: {
              }
          });
          socket.connect();
          // 监听连接成功事件
          socket.on('connect', () => {
              console.log('Connected to server');
              keepAlive(socket);
              resolve(socket);
          });

          socket.on('connect_error', error => {
              console.log('connection error: ' + error.message);
              reject(error);
          })

          // 监听断开连接事件
          socket.on('disconnect', () => {
              console.log('Disconnected from server');
          });

          socket.on('offline', event => {
              console.log('offline', event)
          })

          // 监听错误事件
          socket.on('error', (error) => {
              console.error('Socket error:', error);
          });
        } else {
          reject(new Error('session is null'));
        }
    });
}

function disconnect() {
  if (socket == null) {
    return;
  }
  socket.close();
  socket = null;
}

let keepAliveData = {};

function keepAlive(socket) {
  console.log(socket)
  if (keepAliveData[socket.id]) {
      clearInterval(keepAliveData[socket.id]);
  }
  if (socket) {
      keepAliveData[socket.id] = setInterval(
          () => {
            socket.emit('keepalive', { msg: 1 });
          },
          20000
      );
  }
}

const sendsocketMessage = async (eventType, message, sender, callback) => {
  if (!socket) {
    connect().then(() => {
      socket.off(eventType);
      socket.on(eventType, (data) => {
          chrome.tabs.sendMessage(sender.tab.id, { type: eventType, data }, function () {
              console.log('send message to content script success', data);
          });
      });
      callback('ok');
      socket.emit(eventType, message);
    });
  } else {
    socket.off(eventType);
    socket.on(eventType, (data) => {
        chrome.tabs.sendMessage(sender.tab.id, { type: eventType, data }, function () {
            console.log('send message to content script success', data);
        });
    });
    callback('ok');
    socket.emit(eventType, message);
  }
}
export {
  connect,
  disconnect,
  sendsocketMessage
}