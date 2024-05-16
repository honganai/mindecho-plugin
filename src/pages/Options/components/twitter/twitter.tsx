import React, { useEffect, useContext, useState } from 'react';
import { Button } from 'antd';
import styles from './index.module.scss';
import _, { set } from "lodash";
import GlobalContext from '@/reducer/global';
import BadIcon from '@/assets/icons/bad_icon.png'
import clsx from 'clsx';
import TwitterList from './twitterList';
import { TweetResultsResult, TweetItem, TwitterResult, XBookmarkHeaders } from './type';
import { ArrowLeftOutlined } from '@ant-design/icons';
import useStateRef from './useStateRef';

interface Props {
  onLink: (page: number) => void
}

const TWEET_TYPES = [
  "Tweet",
  "TweetWithVisibilityResults",
  "TimelineTimelineItem",
];
const SEPARATOR = " https://t.co/";
export const X_BOOKMARKS_STORE = `XBookmarkStore`
const X_BOOKMARKS_HEADERS = `XBookmarkHeaders`

const Twitter: React.FC<Props> = ({ onLink }: Props) => {
  const [isLoginTwitter, setIsLoginWitter] = useState(false)
  const [isConfirm, setIsConfirm] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [tweetList, setTweetList] = useState([] as TweetItem[])
  const [isOverrideXHR, setIsOverrideXHR] = useState(false)

  const goTiwtter = () => {
    chrome.runtime.sendMessage({ type: 'twitter' }, (res) => {
      console.log('twitter res:', res);
    });
  }

  useEffect(() => {
    // chrome.storage.local.set({
    //   [X_BOOKMARKS_STORE]: []
    // });
    chrome.storage.local.get(X_BOOKMARKS_STORE).then((data): void => {
      console.log(data[X_BOOKMARKS_STORE]);

      data[X_BOOKMARKS_STORE]
        && data[X_BOOKMARKS_STORE].length
        && setTweetList((prevList) => [
          ...data[X_BOOKMARKS_STORE],
          ...prevList,
        ])

      setIsLoginWitter(!!data.XBookmarkHeaders)
    })

    chrome.storage.local.get(X_BOOKMARKS_HEADERS).then((data): void => {
      setIsLoginWitter(!!data.XBookmarkHeaders)
    })
  }, [])

  useEffect(() => {
    isConfirm && chrome.storage.local.get(X_BOOKMARKS_HEADERS).then((data): void => {

      const { url, method, headers } = data.XBookmarkHeaders as XBookmarkHeaders

      if (!isOverrideXHR) {
        setIsOverrideXHR(true)

        // 重写 XMLHttpRequest.prototype.open 方法
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method: string, url: string) {
          if (url?.includes(`/Bookmarks?variables=`)) {
            const xhr = this;
            xhr.onload = function () {
              let lastStoredIndex = -1
              const result: TwitterResult = JSON.parse(xhr.responseText);
              const entries = result.data.bookmark_timeline_v2.timeline.instructions[0].entries
              const filteredEntries = entries.filter(item => {
                if (TWEET_TYPES.includes(item.content.entryType)
                  && item?.content?.itemContent?.tweet_results.result) {
                  const storedIndex = tweetList.findIndex(({ id }) => id === item.entryId);
                  const isMatch = storedIndex > -1

                  isMatch && (lastStoredIndex = storedIndex)

                  return !isMatch
                }
                return false
              });

              if (lastStoredIndex > -1) {
                setIsFetching(false)
                filteredEntries.splice(lastStoredIndex)
              }

              setTweetList((prevList) => [
                ...prevList,
                ...filteredEntries.map((item) => {
                  if (
                    item &&
                    item.content &&
                    item.content.itemContent &&
                    item.content.itemContent.tweet_results.result
                  ) {
                    const result = (item?.content?.itemContent.tweet_results.result) as TweetResultsResult

                    return {
                      id: item.entryId,
                      title: result.legacy.full_text.split(SEPARATOR)[0],
                      "url": `https://twitter.com/x/status/${result.rest_id}`,
                      "type": "xbookmark",
                      "user_create_time": result.legacy.created_at || '',
                      "node_id": "0",
                      "node_index": "0",
                      "parentId": "0",
                      "user_used_time": result.legacy.created_at || "",
                      "origin_info": "",
                      "author": result.core.user_results.result.legacy.name || '',
                      "content": result.legacy.full_text || '',
                      "status": "1",
                    }
                  }
                })
              ] as unknown as TweetItem[])


              if (entries.length > 2 && lastStoredIndex === -1) {
                const cursor = entries[entries.length - 1].content.value;

                // 解析url请求参数
                const params = new URLSearchParams(url.split('?')[1]);
                params.set('variables', JSON.stringify(Object.assign(JSON.parse(params.get('variables')), { cursor })));

                // 创建一个新的请求
                const newXhr = new XMLHttpRequest();

                newXhr.open(method, `${url.split('?')[0]}?${params.toString()}`);
                // 设置请求头信息
                headers.forEach(({ name, value }) => {
                  newXhr.setRequestHeader(name, value);
                });
                newXhr.send(null);
              } else {
                setIsFetching(false)
                console.log(`isFetching ${isFetching}`);
              }
            };

            //当请求失败时
            xhr.onerror = () => {
              setIsLoginWitter(false)
              setIsConfirm(false)
              setIsFetching(false)
            };
          }

          // 调用原始 open 方法
          originalOpen.apply(this, arguments);
        };

      }
      // 模拟第一次请求
      const newXhr = new XMLHttpRequest();
      newXhr.open(method, url);
      // 设置请求头信息
      headers.forEach(({ name, value }) => {
        newXhr.setRequestHeader(name, value);
      });
      setIsFetching(true)
      newXhr.send(null);

    })
  }, [isConfirm]);

  useEffect(() => {
    chrome.storage.local.set({
      [X_BOOKMARKS_STORE]: tweetList
    });
  }, [tweetList])

  return (
    <div className={clsx(styles.container, 'flex-1 w-0 flex')}>

      <div className='flex items-center justify-center w-6 h-full'>
        <ArrowLeftOutlined className='cursor-pointer' onClick={() => onLink(1)} />
      </div>

      <div className='flex-1 w-0'>
        {!isConfirm ?
          <div className={styles.content}>
            {isLoginTwitter ? <>
              <div className={styles.title}>X Bookmarks</div>
              <p className={styles.tip}>
                Please first go to <span className={styles.backlink} onClick={goTiwtter}>X.com</span> to log in to your account.
              </p>
              <Button className={styles.btn} onClick={() => {
                setIsConfirm(true)
              }}>I’ve Logged In. Go Get My X Bookmarks. </Button>
            </>
              : <div className={styles.errBox}>
                <img src={BadIcon} alt="BadIcon" />
                <p>Not logged into X yet. </p>
                <p>Please try again:</p>
                <p>Go to <a className={styles.backlink}>https://x.com</a></p>
              </div>
            }
          </div>
          : <TwitterList onLink={onLink} isFetching={isFetching} list={tweetList} />
        }
      </div>
    </div>
  );
};

export default Twitter;
