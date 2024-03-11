import React, { useState, useContext } from 'react';
import styles from './index.module.scss';
import { Button, message } from 'antd';
import { UserInfo } from '@/types';
import { PAY_URL } from '@/constants';
import { SubType } from '../../user/User';
interface Props {
  userinfo: any;
  onComplete?: (callback: (userinfo: UserInfo) => void) => void; // 点击完成支付
  onStart?: () => void; // 支付完成后点击开始
  onCancle?: () => void; // 取消支付
}

const SubscribeModalContent: React.FC<Props> = ({ onComplete, onStart, onCancle }: Props) => {
  const [isPaymengPageOpened, setIsPaymengPageOpened] = useState(false);

  return (
    <div className={styles.container}>
      <div className="sub-container">
        {!isPaymengPageOpened ? (
          <>
            <div className="sub-title">{chrome.i18n.getMessage('paymentTitle')}</div>
            <Button
              type="primary"
              size={'large'}
              className="sub-btn"
              onClick={() => {
                setIsPaymengPageOpened(true);
                window.open(PAY_URL);
              }}>
              {chrome.i18n.getMessage('upgradeTo300')}
            </Button>
            <div
              className="sub-cancle"
              onClick={() => {
                onCancle?.();
              }}>
              {chrome.i18n.getMessage('paymentIsCancle')}
            </div>
          </>
        ) : (
          <Button
            type="primary"
            size={'large'}
            className="sub-btn"
            onClick={() => {
              onComplete?.((userinfo: UserInfo) => {
                if (
                  userinfo?.subscription?.mem_type === SubType.Free &&
                  userinfo?.subscription?.quota_used_count >= userinfo?.subscription?.total_monthly_quota
                ) {
                  // 未完成充值
                  message.warn(chrome.i18n.getMessage('payFail'));
                  setIsPaymengPageOpened(false);
                } else {
                  // 直接刷新，不需要再点击start
                  onStart?.();
                }
              });
              onStart?.();
            }}>
            {chrome.i18n.getMessage('paymentIsCompleted')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscribeModalContent;
