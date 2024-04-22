/* eslint-disable no-undef */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import _ from 'lodash';
import getCleanArticle from './distillConfig';
import { setPagesInfo, getHistoryAutoAdd } from '@/constants';
import './content.styles.css';

// 如果content已加载，不再重复加载
if (!window.contentLoaded) {
  window.contentLoaded = true;
  console.log('🚀 indexFlat.js -[mindecho-sidebar-flat] init- line:11');

  init();
}

function addNewStyle(newStyle) {
  var styleElement = document.getElementById('styles_js');

  if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.id = 'mindecho-extension-styles';
      document.getElementsByTagName('head')[0].appendChild(styleElement);
  }

  styleElement.appendChild(document.createTextNode(newStyle));
}

addNewStyle('body * {user-select: auto !important;}');

function init() {
  grabPageInfo();
  let extensionRoot = document.getElementById('mindecho-extension-shadow');
  if (extensionRoot) {
    const shadowRoot = extensionRoot.shadowRoot;
    let div = shadowRoot.getElementById('mindecho-sidebar-flat');
    if (!div) {
      div = document.createElement('div');
      div.setAttribute('id', 'mindecho-sidebar-flat');
      shadowRoot.appendChild(div);
    }
    let doc = shadowRoot.getElementById('mindecho-sidebar-document'); // 用于显示移除了flat之后还需要显示的浮层信息
    if (!doc) {
      doc = document.createElement('div');
      doc.setAttribute('id', 'mindecho-sidebar-document');
      shadowRoot.appendChild(doc);
    }

    const root = createRoot(doc);
    root.render(<Root />);
  }
}

async function grabPageInfo() {
  // 获取页面中的JSON-LD数据
  const typeList = ['NewsArticle', 'Article', 'BlogPosting', 'ScholarlyArticle'];
  const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
  const cTypeList = [];
  jsonLdElements.forEach(el => {
    try {
      const data = JSON.parse(el.innerText);
      console.log('Found Schema.org data:', data);
      _.isArray(data) && data.forEach(item => {cTypeList.push(item['@type'])});
      _.isObject(data) && cTypeList.push(data['@type']);
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
    }
  });
  console.log(111111, cTypeList)
  const result = _.intersectionBy(typeList, cTypeList);
  if (result.length > 0) {
    const {title, content, timestrip} = getCleanArticle();
    const info = {
      title,
      url: window.location.href, 
      type: 'history', 
      user_create_time: timestrip, 
      node_id: 0, node_index: 0, parentId: 0, 
      user_used_time: new Date().toISOString(), 
      origin_info: '', 
      author: document.querySelector('meta[name="author"]')?.content || document.querySelector('meta[property="og:article:author"]')?.content || document.querySelector('[class*="time"]')?.innerHTML || '', 
      content, 
      status: 3};
  
    const auto = await getHistoryAutoAdd();
    console.log(222222, auto, info )
    if ( auto ) {
      chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_article', body: [info] }, (res) => {
        console.log('uploadUserArticle res:', res);
      });
    }else {
      setPagesInfo(info);
    }
  }
}
