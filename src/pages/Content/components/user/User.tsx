import React, { useState, useMemo, useContext } from 'react';
import { Button, message } from 'antd';
import { Logout, Mail, Diamond } from '@icon-park/react';
import { CONTACT_URL } from '@/constants';
import { PAY_URL } from '@/constants';
import PaymentPopup from '../PaymentPopup';
import { UserInfo } from '@/types';
import GlobalContext from '@/reducer/global';
import reqShowSummary from '@/utils/showSummary';

import styles from './index.module.scss';

export enum SubType {
  Free = 'free',
  Premium = 'premium',
}
interface Props {
  userinfo?: UserInfo;
  onOpen?: () => void;
  checkPay: ([key]: any) => void;
}

const History: React.FC<Props> = ({ userinfo, onOpen, checkPay }: Props) => {
  const [uInfo, setUInfo] = useState(userinfo as UserInfo);
  const { state: globalState } = useContext(GlobalContext);
  const { userName, subscription, isPremium } = useMemo(() => {
    return {
      userName: uInfo.username || '-',
      subscription: uInfo.subscription || {},
      isPremium: uInfo?.subscription && uInfo?.subscription.mem_type === SubType.Premium,
    };
  }, [uInfo]);
  console.log('🚀 ~ file: User.tsx:21 ~ subscription:', subscription);

  const logout = () => {
    chrome.runtime.sendMessage({ type: 'logout', data: {} }, (res) => {
      console.log('logout res:', res);
    });
  };

  const onPaymentComplete = () => {
    checkPay((userinfo: UserInfo) => {
      if (
        userinfo?.subscription?.mem_type === SubType.Free &&
        userinfo?.subscription?.quota_used_count >= userinfo?.subscription?.total_monthly_quota
      ) {
        // 未完成充值
        message.warn(chrome.i18n.getMessage('payFail'));
      } else {
        // 直接刷新，不需要再点击start
        setUInfo(userinfo);
        reqShowSummary(globalState.cleanArticle.content);
      }
    });
  };
  return (
    <div className={styles.container}>
      <div className="user-info">
        <span className="name">{`${chrome.i18n.getMessage('hello')}, ${userName}`}</span>
        {isPremium && <Diamond className="vip" theme="outline" size="15" fill="#333" strokeWidth={2} />}
      </div>
      <div className="subscribe-info">
        <span>{chrome.i18n.getMessage('enjoyYourReading')}</span>
        <span>
          {!isPremium ? chrome.i18n.getMessage('currentFreeUsage') : chrome.i18n.getMessage('currentUsage')}:
          {` ${subscription.quota_used_count}/${subscription.total_monthly_quota}`}
        </span>
        {!isPremium && (
          <Button
            type="primary"
            className="upgrade"
            onClick={() => {
              onOpen?.();
              if (!globalState.showSubscribeModal) {
                PaymentPopup({
                  onComplete: onPaymentComplete,
                });
              }
              window.open(PAY_URL);
            }}>
            {chrome.i18n.getMessage('userPayBtn')}
          </Button>
        )}
      </div>
      <div className="operate">
        <a className="link" target="_blank" rel="noreferrer" href={CONTACT_URL}>
          <Mail theme="outline" size="20" fill="#333" strokeWidth={2} />
          <span>{chrome.i18n.getMessage('contactUs')}</span>
        </a>
        <a
          className="link"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}>
          <Logout theme="outline" size="20" fill="#333" strokeWidth={2} />
          <span>{chrome.i18n.getMessage('logout')}</span>
        </a>
      </div>
    </div>
  );
};

export default History;
