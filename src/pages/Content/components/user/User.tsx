import React, {useEffect} from 'react';
import dayjs from 'dayjs';
import { Button, List } from 'antd';
import { LogoutOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { CONTACT_URL, SUBSCRIBE_URL } from '@/constants';
import cs from 'classnames';
import SubscribeIcon from '../../../../assets/icons/subscribe.svg';
import DiamondIcon from '../../../../assets/icons/diamond.svg';
import { PAY_URL } from '@/constants';

import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";

export enum SubType {
  Free = 'free',
  Premium = 'premium',
  Elite = 'elite',
}
interface Props {
  userinfo?: any;
}

const History: React.FC<Props> = ({ userinfo = {} }: Props) => {
  const logoutText = chrome.i18n.getMessage('logout');
  const userName = userinfo.username || '-';
  const { subscription = {} } = userinfo;
  console.log('🚀 ~ file: User.tsx:21 ~ subscription:', subscription);

  const logout = () => {
    chrome.runtime.sendMessage({ type: 'logout', data: {} }, (res) => {
      console.log('logout res:', res);
    });
  };

  useEffect(() => {
    //发送用户身份信息
    const event_name="plugin_show_profile"
    console.log('posthog event_name', event_name);
    posthog.capture(event_name, {email: userinfo.email, name: userinfo.username })
  }, [userinfo?.id]);

  return (
    <div className={styles.container}>
      <div className={styles['user-info']}>
        <span className={styles['name']}>{userName}</span>
      </div>
      <div className={styles['subscribe-info']}>
        <div className={cs(styles['subscribe-type'], subscription.mem_type !== SubType.Free && styles['premium'])}>
          <SubscribeIcon />
          <span>
            {subscription.mem_type === SubType.Free
              ? 'Free'
              : subscription.mem_type === SubType.Premium
              ? 'Premium'
              : 'Elite'}
          </span>
        </div>
        <div className={styles['subscribe-detail']}>
          {subscription.mem_type === SubType.Free && (
            <div className={styles['detail-item']}>
              {chrome.i18n.getMessage('freeQuotaEveryMonth', [subscription.total_monthly_quota])}
            </div>
          )}
          <div className={styles['detail-item']}>
            <span className={styles['label']}>{chrome.i18n.getMessage('usage')}</span>
            <span className={styles['value']}>
              {subscription.mem_type === SubType.Elite ? (
                'Unlimited'
              ) : (
                <>
                  {subscription.quota_used_count}&nbsp;/&nbsp;
                  <span className={cs([styles.bold, subscription.mem_type !== SubType.Free && styles.highlight])}>
                    {subscription.total_monthly_quota}
                  </span>
                </>
              )}
            </span>
          </div>

          {subscription.mem_type !== SubType.Free && (
            <div className={styles['detail-item']}>
              <span className={styles['label']}>GPT-4</span>
              <span className={styles['value']}>
                {subscription.mem_type === SubType.Elite ? (
                  'Unlimited'
                ) : (
                  <>
                    {subscription.gpt4_used_count}&nbsp;/&nbsp;
                    <span className={cs([styles.bold, subscription.mem_type !== SubType.Free && styles.highlight])}>
                      {subscription.gpt4_quota}
                    </span>
                  </>
                )}
              </span>
            </div>
          )}
          <div className={styles['detail-item']}>
            <span className={styles['label']}>{chrome.i18n.getMessage('resetsOn')}</span>
            <span className={styles['value']}>{dayjs(subscription.quota_reset_time).format('MM/DD/YYYY')}</span>
          </div>
          {subscription.mem_type !== SubType.Free && (
            <div className={styles['detail-item']}>
              <span className={styles['label']}>{chrome.i18n.getMessage('expiresOn')}</span>
              <span className={styles['value']}>{dayjs(subscription.mem_ship_date).format('MM/DD/YYYY')}</span>
            </div>
          )}
          {subscription.mem_type === SubType.Free && (
            <div className={styles['detail-item']}>
              {chrome.i18n.getMessage('notEnough')}{' '}
              <a
                onClick={() => {
                  window.open(PAY_URL);
                }}>
                {chrome.i18n.getMessage('getMore')}
              </a>
            </div>
          )}
        </div>
        {subscription.mem_type !== SubType.Free && (
          <a className={styles['link']} target="_blank" rel="noreferrer" href={SUBSCRIBE_URL}>
            <DiamondIcon />
            <span>{chrome.i18n.getMessage('manageSubscription')}</span>
          </a>
        )}
      </div>
      <div className={styles['operate']}>
        <a className={styles['link']} target="_blank" rel="noreferrer" href={CONTACT_URL}>
          <QuestionCircleOutlined />
          <span>{chrome.i18n.getMessage('contactUs')}</span>
        </a>
        <a
          className={styles['link']}
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}>
          <LogoutOutlined />
          <span>{logoutText}</span>
        </a>
      </div>
    </div>
  );
};

export default History;
