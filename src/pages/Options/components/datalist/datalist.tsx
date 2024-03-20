import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Tree, Spin, message } from 'antd';
import type { TreeDataNode } from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import logo from '@/assets/icons/logo.png';
import GlobalContext, { ActionType, IUpateData, IBookmarks, IHistory, IReadingList } from '@/reducer/global';


export enum SubType {
  Free = 'free',
  Premium = 'premium',
  Elite = 'elite',
}

interface IMergeData {
  id: number;
  title: string;
  url: string;
  type: 'history' | 'bookmark' | 'readinglist';
  user_create_time: string;
  node_id: string;
  node_index: string;
  parentId: string;
  user_used_time: string;
  origin_info: IBookmarks | IHistory | IReadingList;
  status?: 1 | 0;
}
interface Props {
  userinfo?: any;
  onLink: Function;
}

const User: React.FC<Props> = ({ onLink }) => {
  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { upateData, bookmarks: bookmarksData }, dispatch: globalDispatch } = useContext(GlobalContext);
  const [userUrl, setUserUrl] = useState<IMergeData[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [keyList, setKeyList] = useState<string[]>(['bookmarks', 'readinglist', 'history']);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([`parent-${keyList[0]}`, `parent-${keyList[1]}`, `parent-${keyList[2]}`]);
  //const [selectedKeys, setSelectedKeys] = useState<React.Key[]>(['bookmarks']);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [checkedCount, setCheckedCount] = useState<number>(0);
  const [searchWord, setSearchWord] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const onExpand = (expandedKeysValue: React.Key[]) => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeysValue: React.Key[], event: any) => {
    //console.log('onCheck', checkedKeysValue, event);
    setCheckedKeys(checkedKeysValue);
    setCheckedCount(checkedKeysValue.length)
  };

  // const onSelect = (selectedKeysValue: React.Key[], info: any) => {
  //   console.log('onSelect', info);
  //   setSelectedKeys(selectedKeysValue);
  // };

  useEffect(() => {
    getUserUrl()
  }, [searchWord]);

  const getUserUrl = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: 999, title: searchWord } }, (res) => {
      //console.log('getUserUrl res:', res);
      if (res?.result?.length > 0) {
        parsingData(res?.result)
      } else {
        message.error('No data found');
        setLoading(false);
      }
    });
  }

  const parsingData = (data: any) => {
    const reusltData = [
      { title: 'Bookmarks', key: `parent-${keyList[0]}`, children: [] as any[] },
      { title: 'Reading List', key: `parent-${keyList[1]}`, children: [] as any[] },
      { title: 'History', key: `parent-${keyList[2]}`, children: [] as any[] },
    ];
    const bookmarksMap = new Map<string, Array<any>>();
    data.forEach((item: any) => {
      item.status = 1;
      switch (item.type) {
        case 'bookmark':
          if (!bookmarksMap.has(item.parentId)) {
            bookmarksMap.set(item.parentId, []);
          }
          bookmarksMap.get(item.parentId)?.push(
            {
              title: item.title,
              key: keyList[0] + '-' + item.id,
              url: item.url
            }
          );
          break;

        case 'readinglist':
          reusltData[1].children?.push({
            title: item.title,
            key: keyList[1] + '-' + item.id,
            url: item.url
          });
          break;

        case 'history':
          reusltData[2].children?.push({
            title: item.title,
            key: keyList[2] + '-' + item.id,
            url: item.url
          });
          break;
      }
    });
    const bookmarks = parsingBookMarks(bookmarksData, bookmarksMap)
    reusltData[0].children?.push(...bookmarks.children || []);
    setUserUrl(data)
    setCheckedCount(data.length)
    setTreeData(reusltData)
    setLoading(false);
    onExpand([`parent-${keyList[0]}`, `parent-${keyList[1]}`])
  }

  const parsingBookMarks = (data: any, map: Map<string, any>): TreeDataNode => {
    const result: TreeDataNode = { title: data.title, key: 'parent-' + data.id, children: [] }
    for (const item of data.children || []) {
      if (item.children?.length > 0) {
        result?.children?.push(parsingBookMarks(item, map))
      }
    }
    if (map.has(data.id)) {
      result?.children?.push(...map.get(data.id))
    }
    return result;
  }

  const onChange = () => { }

  const onImport = () => {
    const data = userUrl.map((item) => {
      return {
        url: item.url,
        status: checkedKeys.some(checkedItem => checkedItem.split('-')[1] == item.id) ? 1 : 0,
      }
    })
    globalDispatch({
      type: ActionType.SetUpateData,
      payload: data as Array<IUpateData> || [],
    });
    onLink(3)
  }

  const searchKeyWord = (e: any) => {
    const searchText = e.target.value;
    if (searchText.trim() !== searchWord) {
      setSearchWord(e.target.value)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles['userInfo']}>
        <img className={styles['logo']} src={logo} alt="logo" />
      </div>
      <div className={styles['content']}>
        <div className={styles['header']}>
          <div className={styles['back']} onClick={() => onLink(1)}>
            <ArrowLeftOutlined />
          </div>
          <p>BookMarks & Reading Lists</p>
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
            <span>Import {checkedCount} Items</span>
          </Button>
        </div>
        <div className={styles['control-box']}>
          <Input className={styles['search']} placeholder="Find items by keywords" prefix={<SearchOutlined />} onPressEnter={searchKeyWord} />
          <Checkbox className={styles['select']} onChange={onChange}>Select/Deselect All Shown</Checkbox>
        </div>
        <Spin spinning={loading} tip='Loading...'>
          <div className={styles['list-box']}>
            <Tree
              checkable
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onCheck={onCheck}
              checkedKeys={checkedKeys}
              //onSelect={onSelect}
              //selectedKeys={selectedKeys}
              treeData={treeData}
            />
          </div>
        </Spin>

        <p>* Data on the current page is local only. No URLs will be synchronized unless selected and submitted in further steps.</p>
      </div>
    </div>
  );
};

export default User;
