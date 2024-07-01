/* eslint-disable no-undef */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import _ from 'lodash';
import { getPdfTextContent } from '@/utils/common.util';
import getCleanArticle from './distillConfig';
import { setPagesInfo, getHistoryAutoAdd } from '@/constants';
import './content.styles.css';

// 如果content已加载，不再重复加载
if (!window.contentLoaded) {
  window.contentLoaded = true;

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
  const data = await getNeedAndData();
  if (data) {
    updatePageInfo(data);
  }
}

async function updatePageInfo(pageInfo) {
  const info = {
    title: pageInfo?.title || '',
    url: window.location.href,
    type: 'history',
    user_create_time: pageInfo?.timestrip || new Date().toISOString(),
    node_id: 0,
    node_index: 0,
    parentId: 0,
    user_used_time: new Date().toISOString(),
    origin_info: '',
    author:
      pageInfo?.author ||
      document.querySelector('meta[name="author"]')?.content ||
      document.querySelector('meta[property="og:article:author"]')?.content ||
      document.querySelector('[class*="author"]')?.innerHTML ||
      '',
    content: pageInfo?.content || '',
    status: 3,
  };

  const auto = await getHistoryAutoAdd();
  if (auto) {
    chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_article', body: [info] }, (res) => {
      console.log('uploadUserArticle res:', res);
    });
  } else {
    setPagesInfo(info);
  }
}

async function getNeedAndData() {
  // 获取页面中的JSON-LD数据
  //如果schema为新闻、文章、博客、学术文章中的一种，则返回true
  const typeList = ['NewsArticle', 'Article', 'BlogPosting', 'ScholarlyArticle'];
  const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
  const cTypeList = [];

  jsonLdElements.forEach((el) => {
    try {
      const data = JSON.parse(el.innerText);

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item['@type']) {
            cTypeList.push(item['@type']);
          }
        });
      } else if (typeof data === 'object' && data['@type']) {
        cTypeList.push(data['@type']);
      } else if (data['@graph']) {
        data['@graph'].forEach((item) => {
          if (item['@type']) {
            cTypeList.push(item['@type']);
          }
        });
      }

      console.log('Found Schema.org data:', data);
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
    }
  });
  const result = _.intersectionBy(typeList, cTypeList);
  if (result.length > 0 || window.location.href.startsWith('https://mp.weixin.qq.com/s')) {
    const { title, content, timestrip } = getCleanArticle();
    return { title, content, timestrip };
  }
  //如果网页后缀为.pdf，则返回true
  else if (
    window.location.href.endsWith('.pdf') ||
    (window.location.href.includes('arxiv.org/pdf/') && document.querySelector('embed[type="application/pdf"]'))
  ) {
    const res = await getPdfTextContent({ pdfUrl: window.location.href });
    if (res.status === 'completed') {
      console.log('completed');
      return res.result;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
