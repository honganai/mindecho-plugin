import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import styles from './index.module.scss';
import BadIcon from '@/assets/icons/bad_icon.png';
import XGuidePNG from '@/assets/icons/CleanShot 2024-05-17 at 13.45 1.png';
import clsx from 'clsx';
import TwitterList from './twitterList';
import { TweetResultsResult, TweetItem, TwitterResult, XBookmarkHeaders } from './type';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getLocalStorage, setLocalStorage } from './storage';
import { useNavigate } from 'react-router-dom';
interface Props {
}

const TWEET_TYPES = [
  "Tweet",
  "TweetWithVisibilityResults",
  "TimelineTimelineItem",
];
const SEPARATOR = " https://t.co/";
export const X_BOOKMARKS_STORE = `XBookmarkStore`;
const X_BOOKMARKS_HEADERS = `XBookmarkHeaders`;

const Twitter: React.FC<Props> = ({ }: Props) => {
  const navigate = useNavigate();
  const { getMessage: t } = chrome.i18n;
  const [isLoginTwitter, setIsLoginTwitter] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [tweetList, setTweetList] = useState<TweetItem[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const goTwitter = () => {
    chrome.runtime.sendMessage({ type: 'twitter' }, (res) => {
      console.log('twitter res:', res);
    });
  };

  useEffect(() => {
    const initializeBookmarks = async () => {
      const storedTweets = await getLocalStorage<TweetItem[]>(X_BOOKMARKS_STORE);
      const bookmarkHeaders = await getLocalStorage<XBookmarkHeaders>(X_BOOKMARKS_HEADERS);

      if (storedTweets?.length) {
        setTweetList(storedTweets);
      }

      setIsLoginTwitter(!!bookmarkHeaders);
    };

    initializeBookmarks();
  }, []);


  useEffect(() => {
    if (!isLoginTwitter) {
      const intervalId = setInterval(async () => {
        const bookmarkHeaders = await getLocalStorage<XBookmarkHeaders>(X_BOOKMARKS_HEADERS);

        setIsLoginTwitter(!!bookmarkHeaders);
      }, 2000);
      setTimer(intervalId);
    } else {
      clearInterval(timer);
    }
  }, [isLoginTwitter])

  useEffect(() => {
    if (isConfirm) {
      clearInterval(timer);

      const fetchBookmarks = async () => {
        const bookmarkHeaders = await getLocalStorage<XBookmarkHeaders>(X_BOOKMARKS_HEADERS);
        if (!bookmarkHeaders) return;

        const { url, method, headers } = bookmarkHeaders;
        setIsFetching(true);

        const fetchTweets = async (requestUrl: string) => {
          try {
            const config: AxiosRequestConfig = {
              method,
              url: requestUrl,
              headers: headers.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {}),
            };

            const response: AxiosResponse<TwitterResult> = await axios(config);
            const result = response.data;

            const entries = result.data.bookmark_timeline_v2.timeline.instructions[0].entries;

            const filteredEntries = entries.filter(item => {
              if (TWEET_TYPES.includes(item.content.entryType)
                && item?.content?.itemContent?.tweet_results.result) {
                const storedIndex = tweetList.findIndex(({ id }) => id === item.entryId);
                return storedIndex === -1;
              }
              return false;
            });

            const newTweets = filteredEntries.map((item) => {
              if (item && item.content && item.content.itemContent && item.content.itemContent.tweet_results.result) {
                const result = item.content.itemContent.tweet_results.result?.tweet ||
                  item.content.itemContent.tweet_results.result;

                try {
                  return {
                    id: item.entryId,
                    title: result.legacy.full_text.split(SEPARATOR)[0],
                    url: `https://twitter.com/x/status/${result.rest_id}`,
                    type: "xbookmark",
                    user_create_time: result.legacy.created_at || '',
                    node_id: "0",
                    node_index: "0",
                    parentId: "0",
                    user_used_time: result.legacy.created_at || "",
                    origin_info: "",
                    author: result.core.user_results.result.legacy.name || '',
                    content: result.legacy.full_text || '',
                    status: "1",
                  } as unknown as TweetItem;
                } catch (error) {
                  console.log(error);
                }

                return null
              }
              return null;
            }).filter(item => item !== null) as TweetItem[];


            setTweetList((prevList) => [
              ...prevList,
              ...newTweets,
            ]);

            await setLocalStorage(X_BOOKMARKS_STORE, tweetList);

            if (entries.length > 2) {
              const cursor = entries[entries.length - 1].content.value;
              const params = new URLSearchParams(requestUrl.split('?')[1]);
              params.set('variables', JSON.stringify({ ...JSON.parse(params.get('variables')!), cursor }));
              const nextUrl = `${requestUrl.split('?')[0]}?${params.toString()}`;

              await fetchTweets(nextUrl);
            } else {
              setIsFetching(false);
            }
          } catch (error) {
            console.error(error);
            setIsLoginTwitter(false);
            setIsConfirm(false);
            setIsFetching(false);
          }
        };

        const params = new URLSearchParams(url.split('?')[1]);
        params.set('variables', JSON.stringify({ ...JSON.parse(params.get('variables')!), cursor: undefined }));
        const nextUrl = `${url.split('?')[0]}?${params.toString()}`;

        await fetchTweets(nextUrl);
      };

      fetchBookmarks();
    }
  }, [isConfirm]);

  return (
    <div className={clsx(styles.container, 'flex-1 w-0 flex')}>
      <div className='flex items-center justify-center w-6 h-full'>
        <ArrowLeftOutlined className='cursor-pointer' onClick={() => navigate('/')} />
      </div>

      <div className='flex-1 w-0'>
        {!isConfirm ? (
          <div className={styles.content}>
            <div className={clsx(
              styles.title,
              'mt-4',
            )}>X Bookmarks</div>

            <p className={clsx(
              styles.tip,
              'flex flex-col items-center justify-center',
              'text-xl text-slate-700'
            )}>
              <p className='w-full'>
                <span className='pl-10'>{t('please_first_log_into_your_x_account_and')}</span>
                <span className='text-bold'>{t('open_your_bookmarks_page')} </span>
                <p className={clsx(
                  styles.backlink,
                  'text-center'
                )} onClick={goTwitter}>https://x.com/i/bookmarks/all</p>
              </p>

              <img className='mt-8' src={XGuidePNG} alt="" />

              <p className='w-full pl-10 my-4'>{t('switch_back_to_this_page_and_continue')}</p>
            </p>

            {isLoginTwitter ? (
              <Button className={clsx(
                styles.btn,
                'min-w-96',
              )} onClick={() => setIsConfirm(true)}>
                {t('continue')} {`>`}
              </Button>
            ) : (
              <Button className={clsx(
                styles.btn,
                'min-w-96',
              )} onClick={goTwitter}>
                {t('to_login_x')}
              </Button>
            )}
          </div>
        ) : (
          <TwitterList isFetching={isFetching} list={tweetList} />
        )}
      </div>
    </div >
  );
};

export default Twitter;
