import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Tree, Spin, message, Switch, TreeDataNode } from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import GlobalContext, { ActionType, IUpateData, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import Header from '../header/header';
import { setAutoAdd as setStorageAutoAdd } from '@/constants';


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
interface ITitleMap {
  [key: string]: string;
}
interface Props {
  userinfo?: any;
  onLink: Function;
}

const DataList: React.FC<Props> = ({ onLink }) => {
  const noDataFoundI18N = chrome.i18n.getMessage('noDataFound');
  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { upateData, bookmarks: bookmarksData }, dispatch: globalDispatch } = useContext(GlobalContext);

  //选中的所有key集合、和初始数据集合
  const [initial, setInitial] = useState<boolean>(true);
  const [allUserUrl, setAllUserUrl] = useState<IMergeData[]>([]);
  //列表展示数据
  const [userUrl, setUserUrl] = useState<IMergeData[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [keyList] = useState<ITitleMap>({ bookmark: 'Bookmarks', readinglist: 'Reading List', history: 'History', pocket: 'Pocket' });
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
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
    //初始默认勾选自动更新
    setStorageAutoAdd(autoAdd);
  }, [])

  useEffect(() => {
    getUserUrl()
  }, [searchWord]);

  const getUserUrl = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: 999, title: searchWord } }, (res) => {
      console.log('🚀 ~ datalist -获取用户上传数据- line:240: ', res);
      if (res?.result?.length > 0) {
        parsingData(res?.result)
      } else {
        message.error(noDataFoundI18N);
        setLoading(false);
      }
    });
  }

  const parsingData = (data: any) => {
    const reusltData: Array<TreeDataNode> = [];
    let reusltDataMap = {} as any;
    // let reusltData_bookmarks: TreeDataNode = {} as TreeDataNode;
    // let reusltData_readinglist: TreeDataNode = {} as TreeDataNode;
    // let reusltData_history: TreeDataNode = {} as TreeDataNode;
    // let reusltData_pocket: TreeDataNode = {} as TreeDataNode;

    // const reusltData: TreeDataNode = [
    //   { title: 'Bookmarks', key: `parent-${keyList[0]}`, children: [] as any[], disableCheckbox: true },
    //   { title: 'Reading List', key: `parent-${keyList[1]}`, children: [] as any[], disableCheckbox: true },
    //   // //@koman 暂时隐藏掉history
    //   // // { title: 'History', key: `parent-${keyList[2]}`, children: [] as any[], disableCheckbox: true },
    //   { title: 'Pocket', key: `parent-${keyList[3]}`, children: [] as any[], disableCheckbox: true },
    // ];
    const currentCheckeds: string[] = [];
    const hasSelected = data.some((item: any) => item.status > 1);
    const bookmarksMap = new Map<string, Array<any>>();
    data.forEach((item: any) => {
      item.selected = false;

      // if (!_.some(reusltData, ['title', keyList[item.type]])) {
      //   const index = reusltData.push({ title: keyList[item.type], key: `parent-${item.type}`, children: [] as any[] });
      //   reusltDataMap[item.type] = reusltData[index - 1];
      // }

      switch (item.type) {
        case 'bookmark':
          initialData(item.type, reusltData, reusltDataMap);

          if (!bookmarksMap.has(item.parentId)) {
            bookmarksMap.set(item.parentId, []);
          }
          bookmarksMap.get(item.parentId)?.push(
            {
              title: item.title,
              key: item.type + '-' + item.id,
              url: item.url
            }
          );
          break;

        case 'readinglist':
          initialData(item.type, reusltData, reusltDataMap);

          reusltDataMap[item.type].children?.push({
            title: item.title,
            key: item.type + '-' + item.id,
            url: item.url
          });
          break;
        //@koman 暂时隐藏掉history
        // case 'history':
        //   initialData(item.type, reusltData, reusltDataMap);

        //   reusltDataMap[item.type].children?.push({
        //     title: item.title,
        //     key: item.type + '-' + item.id,
        //     url: item.urlyarn
        //   });
        //   break;

        case 'pocket':
          initialData(item.type, reusltData, reusltDataMap);

          reusltDataMap[item.type].children?.push({
            title: item.title,
            key: item.type + '-' + item.id,
            url: item.url
          });
          break;
      }
      if ((initial && !hasSelected) || (initial && item.status > 0) || (!initial && isChecked(item.id))) {
        //@koman 暂时隐藏掉history
        if (item.type !== 'history') {
          item.selected = true;
          currentCheckeds.push(item.type + '-' + item.id)
        }
      }
    });
    const bookmarks: TreeDataNode = parsingBookMarks(bookmarksData, bookmarksMap)
    reusltDataMap['bookmark'].children?.push(...bookmarks.children || []);
    setTreeData(reusltData)
    onExpand([reusltData[0]?.key, reusltData[1]?.key])

    if (initial) {
      setAllUserUrl(data);
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

  const initialData = (type: string, data: any, mapData: any) => {
    if (!_.some(data, ['title', keyList[type]])) {
      const index = data.push({ title: keyList[type], key: `parent-${type}`, children: [] as any[] });
      mapData[type] = data[index - 1];
    }
  }

  const onChange = () => {
    setAutoAdd(!autoAdd);
    setStorageAutoAdd(!autoAdd);
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

export default DataList;
