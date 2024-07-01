import React, { useEffect, useContext } from 'react';
import dayjs from 'dayjs';
// import styles from './index.module.scss';
import _ from "lodash";
import GlobalContext, { ActionType, IBookmarks, IHistory, IReadingList, NavigationMap } from '@/reducer/global';
import { motion, AnimatePresence } from "framer-motion";
import { FullScreenLoading } from './FullScreenLoading';
import ManagesSources from '../../pages/manageSources';
import { Collections } from '../../pages/collections';
import { useNavigate } from 'react-router-dom';
export enum SubType {
  Free = 'free',
  Premium = 'premium',
  Elite = 'elite',
}

interface IMergeData {
  title: string;
  url: string;
  type: 'history' | 'bookmark' | 'readinglist' | 'xbookmark';
  user_create_time: string;
  node_id: string;
  node_index: string;
  parentId: string;
  user_used_time: string;
  origin_info: IBookmarks | IHistory | IReadingList;
}

const User: React.FC = () => {
  const navigate = useNavigate();
  const { getMessage: t } = chrome.i18n;
  const [spinning, setSpinning] = React.useState<boolean>(true);
  const { state: { history, bookmarks, readinglist, isLogin, nav }, dispatch: globalDispatch } = useContext(GlobalContext);

  useEffect(() => {
    getHistory();
    getBookmarks();
    getReadingList();
  }, []);

  useEffect(() => {
    // @koman 暂时隐藏history
    //if (history && bookmarks && readinglist) {
    if (bookmarks && readinglist) {
      mergeData()
    }
  }, [history, bookmarks, readinglist]);

  const mergeData = () => {
    const data = [] as Array<IMergeData>;
    //@koman 暂时隐藏history
    // history?.forEach((item) => {
    //   data.push({
    //     title: item.title,
    //     url: item.url,
    //     type: 'history',
    //     user_create_time: dayjs(item.lastVisitTime).format('YYYY-MM-DD HH:mm:ss'),
    //     user_used_time: dayjs(item.lastVisitTime).format('YYYY-MM-DD HH:mm:ss'),
    //     node_id: item.id,
    //     node_index: '',
    //     parentId: '',
    //     origin_info: item,
    //   });
    // });
    readinglist?.forEach((item) => {
      data.push({
        title: item.title,
        url: item.url,
        type: 'readinglist',
        user_create_time: dayjs(item.creationTime).format('YYYY-MM-DD HH:mm:ss'),
        user_used_time: dayjs(item.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss'),
        node_id: '',
        node_index: '',
        parentId: '',
        origin_info: item,
      });
    });
    const result = concatBookmarks(bookmarks as IBookmarks);

    uploadUserUrl([...data, ...result])
  }

  const concatBookmarks = (bookmarkItem: IBookmarks, result = [] as Array<IMergeData>) => {
    for (const item of bookmarkItem?.children || []) {
      // If the node is a bookmark, create a list item and append it to the parent node
      if (item.url) {
        result.push({
          title: item.title,
          url: item.url,
          type: 'bookmark',
          user_create_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
          user_used_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
          node_id: item.id,
          node_index: item.index?.toString() || '',
          parentId: item.parentId || '',
          origin_info: item,
        });
      }

      // If the node has children, recursively display them
      if (item.children) {
        concatBookmarks(item, result);
      }
    }

    return result;
  }

  const getHistory = () => {
    // 获取最近4小时的记录
    let microsecondsPerWeek = 1000 * 60 * 60 * 1;
    let oneWeekAgo = new Date().getTime() - microsecondsPerWeek;

    chrome.history.search(
      { text: '', startTime: oneWeekAgo },
      (res) => {
        console.log('history res:', res);
        // @koman 暂时隐藏history
        // res = res || [];
        // globalDispatch({
        //   type: ActionType.SetHistory,
        //   payload: res as Array<IHistory> || [],
        // });
      }
    )
  }

  const getBookmarks = () => {
    chrome.bookmarks.getTree((tree) => {
      console.log('bookmarks res:', tree[0]);

      globalDispatch({
        type: ActionType.SetBookMarks,
        payload: tree[0] as IBookmarks || {},
      });
    });
  }

  const getReadingList = async () => {
    const res = await chrome.readingList.query({})
    console.log('readingList res:', res);
    globalDispatch({
      type: ActionType.SetReadingList,
      payload: res as Array<IReadingList> || [],
    });
  }

  const uploadUserUrl = (data: Array<IMergeData>) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_url', body: data }, (res) => {
      console.log('uploadUserUrl res:', res);
      setSpinning(false);
    });
  }

  const components = {
    [NavigationMap[0].action]: <Collections />,
    [NavigationMap[1].action]: <ManagesSources />,
  };

  const Component = components[nav || NavigationMap[0].action]; // Use a default value if `nav` is undefined

  return spinning
    ? <FullScreenLoading />
    : Component
};

export default User;
