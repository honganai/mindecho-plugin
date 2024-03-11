/* eslint-disable no-undef */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Content from './Content';
import { getDocument } from '../../utils/common.util';

console.log('window.contentLoaded content:', window.linkContentLoaded);
window.readpointListener = false;
// 如果content已加载，不再重复加载
if (!window.linkContentLoaded) {
  window.linkContentLoaded = true;
  init();
} else {
  getDocument().querySelector('#pointread-sidebar').style.display = 'block'
}

function init() {
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch((error) => console.error(error));
  }

  let extensionRoot = document.getElementById('pointread-extension-shadow');
  if (extensionRoot) {
    const shadowRoot = extensionRoot.shadowRoot;
    let div = shadowRoot.getElementById('pointread-sidebar');
    if (!div) {
      div = document.createElement('div');
      div.setAttribute('id', 'pointread-sidebar');
      shadowRoot.appendChild(div);
    }
    const root = createRoot(div);
    root.render(<Content title={'Sider Content'} />);
  }
}

