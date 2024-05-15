import React, { useEffect, useContext, useState } from 'react';
import { Button } from 'antd';
import styles from './index.module.scss';
import _ from "lodash";
import GlobalContext from '@/reducer/global';
import BadIcon from '@/assets/icons/bad_icon.png'
import clsx from 'clsx';

interface Props {
  onLink: Function;
}

const BOOKMARK_URL = "https://twitter.com/i/bookmarks";
const TWEET_TYPES = [
  "Tweet",
  "TweetWithVisibilityResults",
  "TimelineTimelineItem",
];
const SEPARATOR = " https://t.co/";

const Twitter: React.FC<Props> = ({ onLink }: Props) => {
  const [isLoginTewitter, setIsLoginWitter] = useState(false)
  const { getMessage: t } = chrome.i18n;
  const { state: { }, dispatch: globalDispatch } = useContext(GlobalContext);

  useEffect(() => {
    chrome.storage.local.get('XBookmarkHeaders').then((data) => {

      if (data.XBookmarkHeaders) {
        setIsLoginWitter(true)
      }
      const allData = []
      const { url, method, headers } = data.XBookmarkHeaders
      console.log(headers);

      // 重写 XMLHttpRequest.prototype.open 方法
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method: string, url: string) {
        if (url?.includes(`/Bookmarks?variables=`)) {
          const xhr = this;

          chrome.storage.local.set({
            XXhrInfo: JSON.stringify({
              method,
              url,
              headers: headers,
            }),
          });

          xhr.onload = function () {
            const result = JSON.parse(xhr.responseText);
            const entries = result.data.bookmark_timeline_v2.timeline.instructions[0].entries;
            // 将entries中的数据添加到allData中，并去重
            entries.forEach((entry) => {
              TWEET_TYPES.includes(entry.content.entryType) &&
                !allData.find((item) => item.entryId === entry.entryId) &&
                allData.push(entry);
            });

            if (entries.length > 2) {
              const cursor = entries[entries.length - 1].content.value;
              // 解析url请求参数
              const params = new URLSearchParams(url.split('?')[1]);
              params.set('variables', JSON.stringify(Object.assign(JSON.parse(params.get('variables')), { cursor })));

              // 创建一个新的请求
              const newXhr = new XMLHttpRequest();
              newXhr.open(method, `${url.split('?')[0]}?${params.toString()}`);
              // 设置请求头信息
              headers.forEach(({ name, value }) => {
                console.log({ name, value });

                newXhr.setRequestHeader(name, value);
              });
              newXhr.send(null);
            } else {
              console.log(`🌞 fetched allData `, allData)
            }
          };
        }

        // 调用原始 open 方法
        originalOpen.apply(this, arguments);
      };


      // 模拟第一次请求
      const newXhr = new XMLHttpRequest();
      newXhr.open(method, url);
      // 设置请求头信息
      headers.forEach(({ name, value }) => {
        console.log({ name, value });

        newXhr.setRequestHeader(name, value);
      });
      newXhr.send(null);

    })
  }, []);

  const goTiwtter = () => {
    chrome.runtime.sendMessage({ type: 'twitter' }, (res) => {
      console.log('twitter res:', res);
    });
  }

  return (
    <div className={clsx(styles.container, 'flex-1 w-0')}>
      <div className={styles.content}>
        {isLoginTewitter ? <>
          <div className={styles.title}>X Bookmarks</div>
          <p className={styles.tip}>
            Please first go to <span className={styles.backlink} onClick={goTiwtter}>X.com</span> to log in to your account.
          </p>
          <Button className={styles.btn}>I’ve Logged In. Go Get My X Bookmarks. </Button>
        </>
          : <div className={styles.errBox}>
            <img src={BadIcon} alt="BadIcon" />
            <p>Not logged into X yet. </p>
            <p>Please try again:</p>
            <p>Go to <span className={styles.backlink}>https://x.com</span></p>
          </div>
        }
      </div>
    </div>
  );
};

export default Twitter;
