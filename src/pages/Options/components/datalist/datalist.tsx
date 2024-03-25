import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Tree, Spin, message, Switch } from 'antd';
import type { TreeDataNode } from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import GlobalContext, { ActionType, IUpateData, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import Header from '../header/header';


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
  selected?: boolean;
}
interface Props {
  userinfo?: any;
  onLink: Function;
}

const User: React.FC<Props> = ({ onLink }) => {
  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { upateData, bookmarks: bookmarksData }, dispatch: globalDispatch } = useContext(GlobalContext);

  //选中的所有key集合、和初始数据集合
  const [initial, setInitial] = useState<boolean>(true);
  const [allCheckedKeys, setAllCheckedKeys] = useState<string[]>([]);
  const [allUserUrl, setAllUserUrl] = useState<IMergeData[]>([]);
  //列表展示数据
  const [userUrl, setUserUrl] = useState<IMergeData[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [keyList, setKeyList] = useState<string[]>(['bookmarks', 'readinglist', 'history']);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([`parent-${keyList[0]}`, `parent-${keyList[1]}`, `parent-${keyList[2]}`]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [checkedCount, setCheckedCount] = useState<number>(0);
  const [searchWord, setSearchWord] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [autoAdd, setAutoAdd] = useState<boolean>(true);

  const onExpand = (expandedKeysValue: React.Key[]) => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeysValue: React.Key[], event: any) => {
    console.log('onCheck', checkedKeysValue, event);
    setCheckedKeys(checkedKeysValue);
    selectChange(checkedKeysValue);
  };

  const selectChange = (checkedKeysValue: React.Key[]) => {
    const allSelect = allUserUrl;
    userUrl.forEach((item) => {
      const ischecked = checkedKeysValue.some(itemKeys => itemKeys.split('-')[1] == item.id)
      allSelect[allSelect.findIndex(allSelectItem => allSelectItem.id === item.id)].selected = ischecked ? true : false;
    });
    setAllUserUrl(allSelect);
    setCheckedCount(allSelect.filter(item => item.selected).length)
  }

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'setAutoAddStatus', status: autoAdd })
  }, [])

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
      { title: 'Bookmarks', key: `parent-${keyList[0]}`, children: [] as any[], disableCheckbox: true },
      { title: 'Reading List', key: `parent-${keyList[1]}`, children: [] as any[], disableCheckbox: true },
      // { title: 'History', key: `parent-${keyList[2]}`, children: [] as any[], disableCheckbox: true },
    ];
    const currentCheckeds: string[] = [];
    const hasSelected = data.some((item: any) => item.status > 1);
    const bookmarksMap = new Map<string, Array<any>>();
    data.forEach((item: any) => {
      item.selected = false;
      switch (item.type) {
        case 'bookmark':
          reusltData[0].disableCheckbox = false;
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
          reusltData[1].disableCheckbox = false;
          reusltData[1].children?.push({
            title: item.title,
            key: keyList[1] + '-' + item.id,
            url: item.url
          });
          break;
        //@koman 暂时隐藏掉history
        // case '  history':
        //   reusltData[2].disableCheckbox = false;
        //   reusltData[2].children?.push({
        //     title: item.title,
        //     key: keyList[2] + '-' + item.id,
        //     url: item.urlyarn
        //   });
        //   break;
      }
      if ((initial && !hasSelected) || (initial && item.status > 1) || (!initial && isChecked(item.id))) {
        item.selected = true;
        currentCheckeds.push(item.type === 'bookmark' ? keyList[0] + '-' + item.id : item.type === 'readinglist' ? keyList[1] + '-' + item.id : keyList[2] + '-' + item.id)
      }
    });
    const bookmarks: TreeDataNode = parsingBookMarks(bookmarksData, bookmarksMap)
    reusltData[0].children?.push(...bookmarks.children || []);
    setTreeData(reusltData)
    onExpand([`parent-${keyList[0]}`, `parent-${keyList[1]}`])

    if (initial) {
      setAllUserUrl(data);
      setAllCheckedKeys(currentCheckeds);
      setCheckedCount(currentCheckeds.length);
      setInitial(false);
    }
    setUserUrl(data);
    setCheckedKeys(currentCheckeds);

    setLoading(false);
  }

  const parsingBookMarks = (data: any, map: Map<string, any>): TreeDataNode => {
    const result: TreeDataNode = { title: data.title, key: 'parent-' + data.id, children: [] }
    for (const item of data.children || []) {
      if (item.children?.length > 0) {
        const res = parsingBookMarks(item, map) as any;
        res.children.length > 0 && result?.children?.push(res)
      }
    }
    if (map.has(data.id)) {
      result?.children?.push(...map.get(data.id))
    }
    return result;
  }

  const onChange = () => {
    setAutoAdd(!autoAdd);
    chrome.runtime.sendMessage({ type: 'setAutoAddStatus', status: !autoAdd })
  }

  const onImport = () => {
    const data = allUserUrl.map((item) => {
      return {
        url: item.url,
        status: item.selected ? 1 : 0,
      }
    })
    globalDispatch({
      type: ActionType.SetUpateData,
      payload: data as Array<IUpateData> || [],
    });
    onLink(3)
  }

  const isChecked = (key: string | number) => {

    const result = allUserUrl.filter(item => item.id === key);
    return result[0]?.selected || false;
  }

  const searchKeyWord = (e: any) => {
    const searchText = e.target.value;
    if (searchText.trim() !== searchWord) {
      setSearchWord(e.target.value)
    }
  }

  return (
    <div className={styles.container}>
      {/* <div className={styles['userInfo']}>
        <img className={styles['logo']} src={logo} alt="logo" />
      </div> */}
      <Header tip={'Now it’s time to pick the gems for your very own discovery vault! Echo is all geared up to gather the goodies for you. We suggest skipping over the shortcuts and personal nooks, focusing instead on those content-rich spots you’ll love to revisit.'} />
      <div className={styles['content']}>
        <div className={styles['left']}>
          <div className={styles['back']} onClick={() => onLink(1)}>
            <ArrowLeftOutlined />
          </div>
        </div>
        <div className={styles['center']}>
          <div className={styles['header']}>
            <p>BookMarks & Reading Lists</p>
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
        <div className={styles['right']}>
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
            <span>Import {checkedCount} Items</span>
          </Button>
          <p className={styles['auto-add']}>
            <Switch checked={autoAdd} onChange={onChange} />
            <span>Auto-add New Items</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default User;
