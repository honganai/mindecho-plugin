/* eslint-disable no-undef */
import dayjs from 'dayjs';
import Api from './api';
import _ from 'lodash';
import axios from 'axios';
import { MAX_SIZE } from '@/utils/common.util';
import {
  setLocalURLs,
  getUserInfo,
  getLastUpdateDataTime,
  setLastUpdateDataTime,
  getLastUpdateDataTime_pocket,
  setLastUpdateDataTime_pocket,
} from '@/constants';

const SEPARATOR = ' https://t.co/';
const X_BOOKMARKS_HEADERS = `XBookmarkHeaders`;
const TWEET_TYPES = ['Tweet', 'TweetWithVisibilityResults', 'TimelineTimelineItem'];

const formatDataItem = (item, type) => ({
  title: item.title,
  url: item.url,
  type,
  user_create_time: dayjs(item.creationTime || item.dateAdded || item.user_create_time).format('YYYY-MM-DD HH:mm:ss'),
  user_used_time: dayjs(item.lastUpdateTime || item.dateAdded || item.user_used_time).format('YYYY-MM-DD HH:mm:ss'),
  node_id: item.id || '',
  node_index: item.index?.toString() || '',
  parentId: item.parentId || '',
  origin_info: item,
  status: 1,
});

const collectData = async (lastUpdateTime, lastUpdateTimePocket) => {
  const [bookmarks, readingList, pocket, xBookmark] = await Promise.all([
    getBookmarks(),
    getReadingList(),
    getPocket(),
    getXBookmark(),
  ]);

  console.log('🚀 ~ collectData ~ xBookmark:', xBookmark);
  const data = [];

  readingList?.forEach((item) => {
    if (item.creationTime > lastUpdateTime) {
      data.push(formatDataItem(item, 'readinglist', lastUpdateTime));
    }
  });

  bookmarks?.forEach((item) => {
    if (item.dateAdded > lastUpdateTime) {
      data.push(formatDataItem(item, 'bookmark', lastUpdateTime));
    }
  });

  pocket?.forEach((item) => {
    if (item.user_create_time > lastUpdateTimePocket) {
      data.push(formatDataItem(item, 'readinglist', lastUpdateTimePocket));
    }
  });

  xBookmark?.forEach((item) => {
    if (
      (item.user_create_time > lastUpdateTime && item?.content?.itemContent?.tweet_results?.result?.tweet) ||
      item?.content?.itemContent?.tweet_results?.result
    ) {
      const result =
        item?.content?.itemContent?.tweet_results?.result?.tweet || item?.content?.itemContent?.tweet_results?.result;

      data.push({
        id: item.entryId,
        title: result.legacy.full_text.split(SEPARATOR)[0],
        url: `https://twitter.com/x/status/${result.rest_id}`,
        type: 'xbookmark',
        user_create_time: new Date(result.legacy.created_at),
        user_used_time: new Date(result.legacy.created_at),
        node_id: '0',
        node_index: '0',
        parentId: '0',
        origin_info: '',
        author: result.core.user_results.result.legacy.name || '',
        content: result.legacy.full_text || '',
        status: 3,
      });
    }
  });

  return data;
};

const startAutoAdd = async () => {
  const userInfo = await getUserInfo();
  if (!userInfo) return false;

  const [lastUpdateTime, lastUpdateTimePocket] = await Promise.all([
    getLastUpdateDataTime(),
    getLastUpdateDataTime_pocket(),
  ]);

  const data = await collectData(lastUpdateTime, lastUpdateTimePocket);

  if (data.length > 0) {
    await uploadUserUrl(data);
    setLocalURLs(data);
    setLastUpdateDataTime(new Date().getTime());
    setLastUpdateDataTime_pocket(new Date().getTime());
  }
};

const getBookmarks = () => {
  return chrome.bookmarks.getRecent(100).then((tree) => {
    console.log('bookmarks res:', tree);
    return tree || {};
  });
};

const getReadingList = () => {
  return chrome.readingList.query({}).then((res) => {
    console.log('readingList res:', res);
    return res || [];
  });
};

const getPocket = () => {
  return Api['get_user_url']({ body: { page: 1, page_size: MAX_SIZE, title: '', type: 'pocket' } }).then((res) => {
    return res.json()?.result || [];
  });
};

const getXBookmark = async () => {
  const filteredEntries = [];
  const fetchBookmarks = async () => {
    const bookmarkHeaders = ((await chrome.storage.local.get(X_BOOKMARKS_HEADERS)) || {})[X_BOOKMARKS_HEADERS];
    if (_.isNull(bookmarkHeaders)) return;
    const { url, method, headers } = bookmarkHeaders;

    const fetchTweets = async (requestUrl) => {
      try {
        const config = {
          method,
          url: requestUrl,
          headers: headers.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {}),
        };

        const response = await axios(config);
        const result = response.data;
        const entries = result.data.bookmark_timeline_v2.timeline.instructions[0].entries;

        filteredEntries.push(
          ...entries.filter((item) => {
            if (TWEET_TYPES.includes(item.content.entryType) && item?.content?.itemContent?.tweet_results.result) {
              const storedIndex = filteredEntries.findIndex(({ id }) => id === item.entryId);
              return storedIndex === -1;
            }
            return false;
          }),
        );

        if (entries.length > 2) {
          const cursor = entries[entries.length - 1].content.value;
          const params = new URLSearchParams(requestUrl.split('?')[1]);
          params.set('variables', JSON.stringify({ ...JSON.parse(params.get('variables')), cursor }));
          const nextUrl = `${requestUrl.split('?')[0]}?${params.toString()}`;

          await fetchTweets(nextUrl);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const params = new URLSearchParams(url.split('?')[1]);
    params.set('variables', JSON.stringify({ ...JSON.parse(params.get('variables')), cursor: undefined }));
    const nextUrl = `${url.split('?')[0]}?${params.toString()}`;

    await fetchTweets(nextUrl);
  };

  await fetchBookmarks();
  return filteredEntries;
};

const uploadUserUrl = (data) => {
  const urls = [];
  const articles = [];
  data.forEach((item) => {
    if (item.content) {
      articles.push(item);
    } else {
      urls.push(item.url);
    }
  });

  urls.length &&
    Api['upload_user_url']({ body: urls }).then((res) => {
      console.log('auto add res:', res);
    });

  articles.length &&
    Api['upload_user_article']({ body: articles }).then((res) => {
      console.log('auto add res:', res);
    });
};

export { startAutoAdd };
