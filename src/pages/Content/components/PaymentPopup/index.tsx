import React from 'react';
import { Button } from 'antd';
import { createRoot } from 'react-dom/client';
import { getDocument } from '@/utils/common.util';

import styles from './index.module.scss';

export default function ({ onclose, onComplete }: { onclose?: any; onComplete: any }) {
  const CONTAINER_ID = 'payment-popup';
  const doc = getDocument().getElementById('pointread-sidebar') as Element;

  const paymentContainer = document.createElement('div');
  paymentContainer.setAttribute('id', CONTAINER_ID);
  paymentContainer.setAttribute(
    'style',
    `
    width:100%;
    height:100%;
    position:absolute;
    top:0;
    display:flex;
    justify-content:center;
    z-index:999999999;
    `,
  );
  doc.appendChild(paymentContainer);
  const root = createRoot(paymentContainer);

  const handleUmount = () => {
    root.unmount();
    getDocument().getElementById(CONTAINER_ID)?.remove();
  };

  const handleCompleted = () => {
    onComplete();
    handleUmount();
  };

  const handleCancle = () => {
    onclose?.();
    handleUmount();
  };

  root.render(
    <div className={styles.container}>
      <div className="payment-popup-container">
        <Button className="pay-complete" size={'large'} type="primary" onClick={handleCompleted}>
          {chrome.i18n.getMessage('paymentIsCompleted')}
        </Button>
        {/* <span onClick={handleCancle} className="not-now">
          {chrome.i18n.getMessage('paymentIsCancle')}
        </span> */}
      </div>
    </div>,
  );
}
