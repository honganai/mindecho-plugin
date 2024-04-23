import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Spin, Modal } from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import GlobalContext, { ActionType, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import Header from '../header/header';
import pocketIcon from '@/assets/icons/pocket_icon.png';
import TwitterIcon from '@/assets/icons/twitter_icon.png';
import pocketSourceIcon from '@/assets/icons/pocket_source_icon.png';
import RaindRopSourceIcon from '@/assets/icons/raindrop_source_icon.png';

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
  const { getMessage: t } = chrome.i18n;
  const [spinning, setSpinning] = React.useState<boolean>(true);
  const [otherSourceModalShow, setOtherSourceModalShow] = React.useState<boolean>(false);
  const { state: { history, bookmarks, readinglist, isLogin }, dispatch: globalDispatch } = useContext(GlobalContext);

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

  const Bind = (types: string) => {
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

  const getBindStatues = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_status', body: {} }, (res) => {
      if (res?.data?.pocket) {
        onLink(4);
      } else {
        setOtherSourceModalShow(true);
      }
    })
  }

  return (
    <div className={styles.container}>
      <Spin spinning={spinning} tip="initializing..." >
        <Header tip={t('how_about_we_begin_by_choosing_the_treasure_trove_of_information_you’d_like_to_explore_again')} />
        <div className={styles['control']}>
          <Button className={cs(styles['btn'], styles['btn-browser'])} size="middle" type="primary" block onClick={() => onLink(2)} icon={<PlusOutlined />}>
            <span>{t('import_collections_in_browser')}</span>
          </Button>
          <Button className={cs(styles['btn'], styles['btn-other'])} size="middle" block onClick={getBindStatues} icon={<PlusOutlined />}>
            <span>{t('connect_other_sources')}</span>
            <img className={cs(styles['pocket-icon'], styles['icon'])} src={pocketIcon} alt="pocket icon" />
            {/* <img className={cs(styles['twitter-icon'], styles['icon'])} src={TwitterIcon} alt="twitter icon" /> */}
          </Button>

        </div>
      </Spin>
      <Modal footer={false} className={styles['source-modal']} onCancel={() => setOtherSourceModalShow(false)} mask={false} open={otherSourceModalShow} title={t('select_source')} centered={true}>
        <div className={styles['source-content']}>
          <div className={styles['source-pocket']}>
            <PlusOutlined className={styles.addIcon} />
            <div className={styles['source-pocket-title']} onClick={() => Bind('pocket')}>
              <img src={pocketSourceIcon} alt="pocketSourceIcon" />
            </div>
            <div className={styles['source-pocket-text']}>
              <p>{t('your_pocket_saves_list_will_be_imported_with_secure_authorization')}</p>
              <p>{t('full_text_of_the_saves_will_be_fetched_and_made_searchable')}</p>
            </div>
          </div>
          <div className={styles['raindrop-pocket']}>
            <div className={styles['source-raindrop-title']}>
              <img src={RaindRopSourceIcon} alt="RaindRopSourceIcon" />
            </div>
            <div className={styles['source-raindrop-text']}>
              <p>{t('more_sources_will_be_supported')}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default User;
