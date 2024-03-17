/* eslint-disable no-undef */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';

import './content.styles.css';

// 如果content已加载，不再重复加载
if (!window.contentLoaded) {
  window.contentLoaded = true;
  console.log('[mindecho-sidebar-flat] init');

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
