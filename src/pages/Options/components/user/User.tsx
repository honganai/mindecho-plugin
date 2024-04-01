import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Spin } from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { CONTACT_URL, SUBSCRIBE_URL, setBookmarkTime, setReadlistTime, setHistoryTime } from '@/constants';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import logo from '@/assets/icons/logo.png';
import GlobalContext, { ActionType, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import Header from '../header/header';

export enum SubType {
  Free = 'free',
  Premium = 'premium',
  Elite = 'elite',
}

interface IMergeData {
  title: string;
  url: string;
  type: 'history' | 'bookmark' | 'readinglist';
  user_create_time: string;
  node_id: string;
  node_index: string;
  parentId: string;
  user_used_time: string;
  origin_info: IBookmarks | IHistory | IReadingList;
}
interface Props {
  onLink: Function;
}

const User: React.FC<Props> = ({ onLink }: Props) => {
  const [spinning, setSpinning] = React.useState<boolean>(true);

  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { history, bookmarks, readinglist }, dispatch: globalDispatch } = useContext(GlobalContext);

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
    //setHistoryTime(new Date().getTime());
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
    setReadlistTime(new Date().getTime());
    const result = concatBookmarks(bookmarks as IBookmarks);
    setBookmarkTime(new Date().getTime());

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

  return (
    <div className={styles.container}>
      <Spin spinning={spinning} tip="initializing..." fullscreen="true">
        <Header tip={'How about we begin by choosing the treasure trove of information you’d like to explore again?'} />
        <div className={styles['control']}>
          <Button className={cs(styles['btn'], styles['btn-browser'])} size="middle" type="primary" block onClick={() => onLink()} icon={<PlusOutlined />}>
            <span>Import Browser Data</span>
          </Button>
          <Button className={cs(styles['btn'], styles['btn-other'])} size="middle" block disabled icon={<PlusOutlined />}>
            <span>Connect Other Sources</span>
          </Button>

        </div>
      </Spin>
    </div>
  );
};

export default User;
