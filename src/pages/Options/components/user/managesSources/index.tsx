import React from "react";
import Header from '@/pages/Options/components/header/header';
import clsx from 'clsx';
import { Button, Spin, Modal } from 'antd';
import cs from 'classnames';
import pocketIcon from '@/assets/icons/pocket_icon.png';
import TwitterIcon from '@/assets/icons/twitter_icon.png';
import pocketSourceIcon from '@/assets/icons/pocket_source_icon.png';
import twitterSourceIcon from '@/assets/icons/twitter_source_icon.png';
import RaindRopSourceIcon from '@/assets/icons/raindrop_source_icon.png';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import styles from '../index.module.scss';

const { getMessage: t } = chrome.i18n;

export function ManagesSources({ onLink }: { onLink: Function }) {

  const [otherSourceModalShow, setOtherSourceModalShow] = React.useState<boolean>(false);

  const Bind = (types: string) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_status', body: {} }, (res) => {
      if (res?.data?.pocket) {
        onLink(4);
      } else {
        chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_url', body: { bind_source: types, extensionId: chrome.runtime.id } }, (res) => {
          console.log('bindPocket res:', res);
          if (res.data.url !== '') {
            window.open(res.data.url, '_blank');
            // 定义计时器变量
            let timer = 0;
            const interval = 5000;
            const maxTime = 10 * 60 * 1000;

            // 定义定时器函数
            const mainTimer = setInterval(() => {
              timer += interval;
              if (timer >= maxTime) {
                clearInterval(mainTimer); // 超过3分钟后清除主定时器
              } else {
                chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_status', body: { code: res.data.code } }, (res) => {
                  if (res.data[types]) {
                    setOtherSourceModalShow(false);
                    onLink(4);
                    clearInterval(mainTimer); // 成功后清除主定时器
                  }
                });
              }
            }, interval);
          }
        });
      }
    })
  }



  return <div className={clsx(`relative flex flex-col px-4`)}>
    <div className={``}>

      <Button className={clsx(
        `h-20 my-5 font-bold text-xl rounded-xl	flex items-center justify-center`,
      )} size="middle" type="primary" block onClick={() => onLink(2)} icon={<PlusOutlined />}>
        <span>{t('import_collections_in_browser')}</span>
      </Button>
      <Button className={clsx(
        `h-20 my-5 font-bold text-xl rounded-xl	flex items-center justify-center`,
      )} size="middle" block onClick={() => setOtherSourceModalShow(true)} icon={<PlusOutlined />}>
        <span>{t('connect_other_sources')}</span>
        <img className={clsx(`w-10 h-10 ml-2`)} src={pocketIcon} alt="pocket icon" />
        {/* Twitter */}
        {/* <img className={cs(styles['twitter-icon'], styles['icon'])} src={TwitterIcon} alt="twitter icon" /> */}
      </Button>
    </div>
    <Modal footer={false} className={styles['source-modal']} onCancel={() => setOtherSourceModalShow(false)} mask={false} open={otherSourceModalShow} title={t('select_source')} centered={true}>
      <div className={styles['source-content']}>
        {/* pocket数据来源 */}
        <div className={cs(styles['source-item'], styles['source-pocket'])}>
          <PlusOutlined className={styles.addIcon} />
          <div className={styles['source-item-title']} onClick={() => Bind('pocket')}>
            <img src={pocketSourceIcon} alt="pocketSourceIcon" />
          </div>
          <div className={styles['source-item-text']}>
            <p>{t('your_pocket_saves_list_will_be_imported_with_secure_authorization')}</p>
            <p>{t('full_text_of_the_saves_will_be_fetched_and_made_searchable')}</p>
          </div>
        </div>
        {/* Twitter数据 */}
        {/* <div className={cs(styles['source-item'], styles['source-twitter'])}>
    <PlusOutlined className={styles.addIcon} />
    <div className={styles['source-item-title']} onClick={() => onLink(6)}>
      <img src={twitterSourceIcon} alt="twitterSourceIcon" />
    </div>
    <div className={styles['source-item-text']}>
      <p>{t('your_bookmarks_in_X_will_be_imported_with_your_authorization_Full_text_in_the_bookmarked_content_will_be_fetched_and_made_searchable_to_you')}</p>
    </div>
  </div> */}
        {/* 其他 */}
        <div className={styles['raindrop-other']}>
          <div className={styles['source-raindrop-title']}>
            <img src={RaindRopSourceIcon} alt="RaindRopSourceIcon" />
          </div>
          <div className={styles['source-raindrop-text']}>
            <p>{t('more_sources_will_be_supported')}</p>
          </div>
        </div>
      </div>
    </Modal>
  </div>;
}