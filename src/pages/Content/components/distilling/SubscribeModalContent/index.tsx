import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import cs from 'classnames';
import SubscribeIcon from '../../../../../assets/icons/subscribe.svg';
import GlobalContext, { ActionType as GlobalActionType, enumSubscribeModalType } from '@/reducer/global';

import styles from './index.module.scss';
import { Button, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { PAY_URL } from '@/constants';
import { SubType } from '../../user/User';
import { UserInfo } from '@/types';
import _ from "lodash";
import posthog from "posthog-js";

interface Props {
  userinfo: any;
  onComplete?: (callback: (userinfo: UserInfo) => void) => void; // 点击完成支付
  onStart?: () => void; // 支付完成后点击开始
}

const SubscribeModalContent: React.FC<Props> = ({ userinfo, onComplete, onStart }: Props) => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const subscribeModalType = globalState.subscribeModalType || enumSubscribeModalType.Premium;
  const { subscription = {} } = userinfo;
  const [monthPlan, setMonthPlan] = useState<any>();
  const [yearPlan, setYearPlan] = useState<any>();
  const [nextPlan, setNextPlan] = useState<any>();
  const [payOpened, setPayOpened] = useState(false);
  const [payComplete, setPayComplete] = useState(false);

  const diff = dayjs(subscription.quota_reset_time).diff(dayjs(), 'day');

  useEffect(() => {
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'getProduct',
        headers: {},
      },
      (res) => {
        const month = res.result.find((o: any) => o.name === 'Premium' && o.recurring_interval === 'month');
        const year = res.result.find((o: any) => o.name === 'Premium' && o.recurring_interval === 'year');

        const monthElit = res.result.find((o: any) => o.name === 'Elite' && o.recurring_interval === 'month');
        const yearElit = res.result.find((o: any) => o.name === 'Elite' && o.recurring_interval === 'year');

        if (subscribeModalType === enumSubscribeModalType.Premium) {
          month && setMonthPlan(month);
          year && setYearPlan(year);
        } else if (subscribeModalType === enumSubscribeModalType.Elite) {
          monthElit && setMonthPlan(monthElit);
          yearElit && setYearPlan(yearElit);
        }
        setNextPlan(
          res.result.find(
            (o: any) =>
              (subscribeModalType === enumSubscribeModalType.Premium ? o.name === 'Premium' : o.name === 'Elite') &&
              o.recurring_interval === 'month',
          ),
        );
      },
    );
  }, []);

  useEffect(() => {
    //发送用户身份信息
    const event_name=subscription.mem_type === SubType.Free && globalState.subscribeModalClosable ? 'tryAdvancedModels': 'needMore';
    console.log('posthog event_name', event_name);
    posthog.capture("plugin_show_"+event_name, {email: userinfo.email, name: userinfo.username })
  }, [userinfo?.id]);

  return (
    <div className={styles.container}>
      {!payComplete && (
        <>
          <div className={styles.title}>
            {chrome.i18n.getMessage(
              subscribeModalType === enumSubscribeModalType.Premium ? 'quotaResetDays' : 'premiumQuotaResetDays',
              [`${diff}`],
            )}
          </div>
          <div className={styles.detail}>
            <div className={styles['detail-item']}>
              {subscribeModalType === enumSubscribeModalType.Premium ? (
                chrome.i18n.getMessage('freeQuotaEveryMonthDetail', [subscription.total_monthly_quota])
              ) : (
                <span className={styles.bold}>{chrome.i18n.getMessage('premiumMember')}</span>
              )}
            </div>

            <div className={styles['detail-item']}>
              <span className={styles['label']}>
                {chrome.i18n.getMessage(
                  subscribeModalType === enumSubscribeModalType.Premium ? 'currentUsage' : 'pageQueries',
                )}
              </span>
              <span className={styles['value']}>
                {subscription.quota_used_count}&nbsp;/&nbsp;
                <span className={styles.bold}>{subscription.total_monthly_quota}</span>
              </span>
            </div>

            {subscribeModalType === enumSubscribeModalType.Elite && (
              <div className={styles['detail-item']}>
                <span className={styles['label']}>GPT-4</span>
                <span className={styles['value']}>
                  {subscription.gpt4_used_count}&nbsp;/&nbsp;
                  <span className={styles.bold}>{subscription.gpt4_quota}</span>
                </span>
              </div>
            )}

            <div className={styles['detail-item']}>
              <span className={styles['label']}>{chrome.i18n.getMessage('resetsOn')}</span>
              <span className={cs(styles['value'], styles.bold)}>
                {dayjs(subscription.quota_reset_time).format('MM/DD/YYYY')}
              </span>
            </div>
          </div>
        </>
      )}

      {monthPlan && (
        <div className={styles.subscribe}>
          {!payComplete ? (
            <>
              <div className={styles['sub-title']}>
                <h1 className={styles.highlight}>
                  {chrome.i18n.getMessage(
                    subscription.mem_type === SubType.Free && globalState.subscribeModalClosable
                      ? 'tryAdvancedModels'
                      : 'needMore',
                  )}
                </h1>
                <h2>
                  {chrome.i18n.getMessage(
                    subscribeModalType === enumSubscribeModalType.Premium ? 'goPremium' : 'goElite',
                  )}
                </h2>
              </div>

              <div className={styles.price}>
                <div className={styles.value}>${parseFloat((yearPlan.price / 12).toFixed(1))}</div>
                <div className={styles.desc}>
                  <div>{chrome.i18n.getMessage('perMonth')}</div>
                  <div>{chrome.i18n.getMessage('billedAnnually')}</div>
                </div>
              </div>
              <div className={styles['old-price']}>
                ${monthPlan.price} {chrome.i18n.getMessage('billedMonthly')}
              </div>

              <Button
                type="primary"
                block
                size="large"
                onClick={() => {
                  if (payOpened) {
                    onComplete?.((userinfo: UserInfo) => {
                      let paySuccess = false;
                      if (subscribeModalType === enumSubscribeModalType.Premium) {
                        if (userinfo?.subscription?.mem_type !== SubType.Free) {
                          paySuccess = true;
                        }
                      } else if (subscribeModalType === enumSubscribeModalType.Elite) {
                        if (userinfo?.subscription?.mem_type === SubType.Elite) {
                          paySuccess = true;
                        }
                      }
                      if (paySuccess) {
                        setPayOpened(false);
                        onStart?.();
                      } else {
                        // 未完成充值
                        message.warn(chrome.i18n.getMessage('payFail'));
                        setPayOpened(false);
                      }
                    });
                  } else {
                    window.open(PAY_URL);
                    setPayOpened(true);
                  }
                }}>
                {payOpened
                  ? chrome.i18n.getMessage('paymentComplete')
                  : chrome.i18n.getMessage(
                      subscribeModalType === enumSubscribeModalType.Premium ? 'getStarted' : 'goUnlimited',
                    )}
              </Button>
            </>
          ) : (
            <>
              <div className={styles['subscribe-success']}>{chrome.i18n.getMessage('subscribeSuccess')}</div>
              <div
                className={cs([
                  styles['subscribe-type'],
                  subscription.mem_type === SubType.Premium && styles.highlight,
                ])}>
                <SubscribeIcon />
                <span>{subscription.mem_type === SubType.Free ? 'Free' : 'Premium'}</span>
              </div>
            </>
          )}
          <div className={styles['plan-detail']}>
            {/*##用户付费需要翻译语言 因此先写死 不从数据库直接展示*/}
          {subscribeModalType === enumSubscribeModalType.Premium ? (
          <>
          <div className={styles['plan-item']} >
            <CheckCircleOutlined className={styles.icon} />
            <span>
              {chrome.i18n.getMessage('queriesChatsPermonth')}
            </span>
          </div>
          <div className={styles['plan-item']} >
            <CheckCircleOutlined className={styles.icon} />
            <span>
            {chrome.i18n.getMessage('chatWithAdvancedModels')}
          </span>
          </div>
          <div className={styles['plan-item']} >
            <CheckCircleOutlined className={styles.icon} />
            <span>
            {chrome.i18n.getMessage('chatWithPageAdvancedModels')}
          </span>
          </div>
          <div className={styles['plan-item']} >
            <CheckCircleOutlined className={styles.icon} />
            <span>
            {chrome.i18n.getMessage('chatWithPersonalCollections')}
          </span>
          </div>
          <div className={styles['plan-item']} >
            <CheckCircleOutlined className={styles.icon} />
            <span>
            {chrome.i18n.getMessage('priorityEmailSupport')}
          </span>
          </div>
          </>
          ) : (
          <>
            <div className={styles['plan-item']} >
              <CheckCircleOutlined className={styles.icon} />
              <span>
              {chrome.i18n.getMessage('unlimitedQueries')}
              </span>
            </div>
            <div className={styles['plan-item']} >
              <CheckCircleOutlined className={styles.icon} />
              <span>
            {chrome.i18n.getMessage('unlimitedChatswithAdvancedModels')}
              </span>
            </div>
            <div className={styles['plan-item']} >
              <CheckCircleOutlined className={styles.icon} />
              <span>
            {chrome.i18n.getMessage('chatWithPageAdvancedModels')}
              </span>
            </div>
            <div className={styles['plan-item']} >
              <CheckCircleOutlined className={styles.icon} />
              <span>
            {chrome.i18n.getMessage('chatWithPersonalCollections')}
              </span>
            </div>
            <div className={styles['plan-item']} >
              <CheckCircleOutlined className={styles.icon} />
              <span>
            {chrome.i18n.getMessage('priorityEmailSupport')}
              </span>
            </div>
          </>
          )}
          </div>

          {/*<div className={styles['plan-detail']}>*/}
          {/*  {Object.keys(nextPlan.equity_list).map((text, index) => (*/}
          {/*    <div className={styles['plan-item']} key={index}>*/}
          {/*      <CheckCircleOutlined className={styles.icon} />*/}
          {/*      <span>*/}
          {/*        {text}*/}
          {/*      </span>*/}
          {/*    </div>*/}
          {/*  ))}*/}
          {/*</div>*/}

          {globalState.subscribeModalClosable && (
            <div className={styles['not-now']}>
              <a
                onClick={() => {
                  globalDispatch({
                    type: GlobalActionType.SetShowSubscribeModal,
                    payload: {
                      show: false,
                    },
                  });
                }}>
                {chrome.i18n.getMessage('notNow')}
              </a>
            </div>
          )}

          {payComplete && (
            <Button
              type="primary"
              block
              size="large"
              style={{ marginTop: 50 }}
              onClick={() => {
                onStart?.();
              }}>
              {chrome.i18n.getMessage('crush')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscribeModalContent;
