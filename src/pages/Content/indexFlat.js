/* eslint-disable no-undef */
import React from 'react';
import { createRoot } from 'react-dom/client';
import ContentFlat from './ContentFlat';
import { isDisable } from '../../constants';

import './content.styles.css';

// console.log('自动注入开始....');

let showAnimate = false; // 显示icon的入场动画

// 如果content已加载，不再重复加载
if (!window.contentLoaded) {
  window.contentLoaded = true;
  console.log('[pointread-sidebar-flat] init');
  isDisable().then((show) => {
    if (show) {

      const pCount = document.querySelectorAll('p').length;
      if (pCount > 5) {
        // showAnimate = true;
      }
      init();
    }
  });
}
function addNewStyle(newStyle) {
  var styleElement = document.getElementById('styles_js');

  if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.id = 'pointread-extension-styles';
      document.getElementsByTagName('head')[0].appendChild(styleElement);
  }

  styleElement.appendChild(document.createTextNode(newStyle));
}

addNewStyle('body * {user-select: auto !important;}');

function init() {
  let extensionRoot = document.getElementById('pointread-extension-shadow');
  if (extensionRoot) {
    const shadowRoot = extensionRoot.shadowRoot;
    let div = shadowRoot.getElementById('pointread-sidebar-flat');
    if (!div) {
      div = document.createElement('div');
      div.setAttribute('id', 'pointread-sidebar-flat');
      shadowRoot.appendChild(div);
    }
    let doc = shadowRoot.getElementById('pointread-sidebar-document'); // 用于显示移除了flat之后还需要显示的浮层信息
    if (!doc) {
      doc = document.createElement('div');
      doc.setAttribute('id', 'pointread-sidebar-document');
      shadowRoot.appendChild(doc);
    }

    const root = createRoot(div);
    root.render(<ContentFlat showAnimate={showAnimate} title={'Sider Content'} />);
  }
}
