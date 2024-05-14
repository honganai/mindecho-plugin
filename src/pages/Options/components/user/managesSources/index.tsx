import React from "react";
import clsx from 'clsx';
import { Modal } from 'antd';
import pocketSourceIcon from '@/assets/icons/pocket_source_icon.png';
import raindropIcon from '@/assets/icons/image 27.png';
import RIcon from '@/assets/icons/image 30.png';
import XIcon from '@/assets/icons/image 28.png';


import _, { unescape } from 'lodash'
import RaindRopSourceIcon from '@/assets/icons/raindrop_source_icon.png';
import { PlusOutlined } from '@ant-design/icons';

export function ManagesSources({ onLink }: { onLink: Function }) {
  const { getMessage: t } = chrome.i18n;

  const CardComponentMaker = ({ title, subTitle, handleClick }: {
    title: React.ReactElement | string;
    subTitle: React.ReactElement | string;
    handleClick: (() => void) | null
  }): JSX.Element => {
    return <div className={clsx(
      `h-40 min-w-96 w-1/3 rounded-xl text-xl	flex between`,
      `border border-gray-500`,
      `p-4`,
      _.isFunction(handleClick) ? 'cursor-pointer hover hover:border-sky-500' : ''
    )}
      onClick={handleClick || undefined}
    >
      <PlusOutlined style={{ fontSize: '28px' }} className="h-10 mr-2" />

      <div className="w-0 flex-1">
        <p className="h-10 flex text-gray-900 text-xl text-bold">{title}</p>
        <p className="text-gray-500 text-sm mt-2">{subTitle}</p>
      </div>
    </div>
  }

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
            const maxTime = 5 * 1000;

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



  return <div className={clsx(`relative flex flex-col px-4 pl-4`)}>
    <div className="my-4">
      <p className="text-gray-900 text-xl my-2">{t('browser')}</p>
      <div className={clsx(
        `flex wrap gap-4`
      )}>

        {CardComponentMaker({
          title: t('sync_browser_collections'),
          subTitle: t(`choose_from_bookmarks_reading_list_history`),
          handleClick: () => onLink(2)
        })}
      </div>
    </div>

    <div className="my-4">
      <p className="text-gray-900 text-xl my-2">{t('reading_services')}</p>
      <div className={clsx(
        `flex wrap gap-4`
      )}>
        {CardComponentMaker({
          title: <img className="h-full" src={pocketSourceIcon} alt="pocketSourceIcon" />,
          subTitle: t('your_pocket_saves_list_will_be_imported_with_secure_authorization_Full_text_of_the_saves_will_be_fetched_and_made_searchable_to_you'),
          handleClick: () => onLink(4)
        })}
        {CardComponentMaker({
          title: <img src={raindropIcon} alt="raindropIcon" />,
          subTitle: t('more_sources_will_be_supported'),
          handleClick: null
        })}

        {CardComponentMaker({
          title: <img src={RIcon} alt="RIcon" />,
          subTitle: t('more_sources_will_be_supported'),
          handleClick: null
        })}

      </div>
    </div>

    <div className="my-4">
      <p className="text-gray-900 text-xl my-2">{t('social')}</p>
      <div className={clsx(
        `flex wrap gap-1`
      )}>
        {CardComponentMaker({
          title: <img className="h-full" src={XIcon} alt="XIcon" />,
          subTitle: t('your_bookmarks_in_X_will_be_imported_with_your_authorization_Full_text_in_the_bookmarked_content_will_be_fetched_and_made_searchable_to_you'),
          handleClick: null
        })}
      </div>
    </div>

    <Modal footer={false} onCancel={() => setOtherSourceModalShow(false)} mask={false} open={otherSourceModalShow} title={t('select_source')} centered={true}>
      <div>
        {/* pocket数据来源 */}
        <div>
          <PlusOutlined />
          <div onClick={() => Bind('pocket')}>
            <img src={pocketSourceIcon} alt="pocketSourceIcon" />
          </div>
          <div>
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
        <div>
          <div>
            <img src={RaindRopSourceIcon} alt="RaindRopSourceIcon" />
          </div>
          <div>
            <p>{t('more_sources_will_be_supported')}</p>
          </div>
        </div>
      </div>
    </Modal>
  </div >
}