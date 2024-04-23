import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Spin, Switch, TreeDataNode, TreeProps } from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import GlobalContext, { ActionType, IUpateData, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import Header from '../header/header';
import { setAutoAdd as setStorageAutoAdd, setLastUpateDataTime } from '@/constants';
import DataList from '../datalist/datalist';

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

const BrowserData: React.FC<Props> = ({ onLink }) => {
  const { getMessage: t } = chrome.i18n;
  const { state: { upateData, bookmarks: bookmarksData, titleMap: keyList }, dispatch: globalDispatch } = useContext(GlobalContext);

  //选中的所有key集合、和初始数据集合
  const [initial, setInitial] = useState<boolean>(true);
  const [allUserUrl, setAllUserUrl] = useState<IMergeData[]>([]);
  //列表展示数据
  const [userUrl, setUserUrl] = useState<IMergeData[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
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
    const keylist = checkedKeysValue.filter((item: any) => !item.startsWith('parent-'));
    setCheckedKeys(keylist);
    selectChange(keylist);
  };

  const selectChange = (checkedKeysValue: React.Key[]) => {
    const allSelect = allUserUrl;
    userUrl.forEach((item) => {
      const ischecked = checkedKeysValue.some((itemKeys: any) => itemKeys.split('-')[1] == item.id)
      allSelect[allSelect.findIndex(allSelectItem => allSelectItem.id === item.id)].selected = ischecked ? true : false;
    });
    setAllUserUrl(allSelect);
    setCheckedCount(allSelect.filter(item => item.selected).length)
  }

  const onSelect: TreeProps['onSelect'] = (selectedKeysValue, info) => {
    const { node } = info;
    if (node.children) { return false; }
    if (node.checked) {
      setCheckedKeys((pre) => {
        const newKeys = [...pre];
        newKeys.splice(newKeys.findIndex(item => item === node.key), 1);
        selectChange(newKeys);
        return newKeys;
      })
    } else {
      setCheckedKeys((pre) => {
        const newKeys = [...pre, node.key];
        selectChange(newKeys);
        return newKeys;
      })
    }
  };

  useEffect(() => {
    //初始默认勾选自动更新
    setStorageAutoAdd(autoAdd);
  }, [])

  useEffect(() => {
    getUserUrl()
  }, [searchWord]);

  const getUserUrl = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: 999, title: searchWord, type: 'bookmark,readinglist' } }, (res) => {
      console.log('🚀 ~ datalist -获取用户上传数据- line:240: ', res);
      parsingData(res?.result || []);
      // if (res?.result?.length > 0) {
      //   parsingData(res?.result)
      // } else {
      //   message.error(noDataFoundI18N);
      //   setLoading(false);
      // }
    });
  }

  const parsingData = (data: any) => {
    const reusltData: Array<TreeDataNode> = [];
    let reusltDataMap = {} as any;
    const currentCheckeds: string[] = [];
    const hasSelected = data.some((item: any) => item.status > 0);
    const bookmarksMap = new Map<string, Array<any>>();
    data.forEach((item: any) => {
      item.selected = false;

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
    reusltDataMap['bookmark']?.children?.push(...bookmarks.children || []);
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
    setLastUpateDataTime(new Date().getTime());
    onLink(5)
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
      <Header tip={t('select_content_to_be_made_searchable')} />
      <div className={styles['content']}>
        <div className={styles['left']}>
          <div className={styles['back']} onClick={() => onLink(1)}>
            <ArrowLeftOutlined />
          </div>
        </div>
        <div className={styles['center']}>
          <div className={styles['header']}>
            <p>{t('bookMarks_reading_lists')}</p>
          </div>
          <div className={styles['control-box']}>
            <Input className={styles['search']} placeholder="Find items by keywords" prefix={<SearchOutlined />} onPressEnter={searchKeyWord} />
            <Checkbox className={styles['select']} onChange={onChange}>{t('select_deselect_all_shown')}</Checkbox>
          </div>
          <Spin spinning={loading} tip={t('loading')} style={{ background: '#fff' }}>
            <DataList
              checkable
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onCheck={onCheck}
              onSelect={onSelect}
              checkedKeys={checkedKeys}
              treeData={treeData} />
          </Spin>

          <p>* {t('current_URL_list_is_local_only_until_you_authorize_data_collection')}</p>
        </div>
        <div className={styles['right']}>
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
            <span>{t('fetch')} {checkedCount} {t('items')}</span>
          </Button>
          <p className={styles['auto-add']}>
            <Switch checked={autoAdd} onChange={onChange} />
            <span>{t('auto_add_new_items')}</span>
          </p>
          <p onClick={() => onLink(5)} className={styles['exclude-tip']}>{t('skip_this_step')}</p>
        </div>
      </div>
    </div>
  );
};

export default BrowserData;
