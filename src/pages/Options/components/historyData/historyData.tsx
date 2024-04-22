import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Tree, Spin, message, Switch, TreeDataNode, TreeProps } from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import _ from "lodash";
import GlobalContext from '@/reducer/global';
import Header from '../header/header';
import { setHistoryAutoAdd as setStorageAutoAdd, getPagesInfo, initPagesInfo } from '@/constants';
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
  origin_info: any;
  status?: 1 | 0;
  selected?: boolean;
}
interface Props {
  userinfo?: any;
  onLink: Function;
}

const HistoryData: React.FC<Props> = ({ onLink }) => {
  const noDataFoundI18N = chrome.i18n.getMessage('noDataFound');
  const { state: { titleMap: keyList }, dispatch: globalDispatch } = useContext(GlobalContext);

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

  const getUserUrl = async () => {
    let pagesInfo = await getPagesInfo();
    if (searchWord.trim()) {
      pagesInfo = _.filter(pagesInfo, (item) => item.title.includes(searchWord));
    }
    console.log(111111, pagesInfo, searchWord)
    setLoading(true);
    parsingData(pagesInfo || []);
  }

  const parsingData = (data: any) => {
    const reusltData: Array<TreeDataNode> = [];
    let reusltDataMap = {} as any;
    const currentCheckeds: string[] = [];
    const hasSelected = data.some((item: any) => item.status > 0);
    data.forEach((item: any) => {
      item.selected = false;
      initialData(item.type, reusltData, reusltDataMap);

      reusltDataMap[item.type].children?.push({
        title: item.title,
        key: item.type + '-' + item.id,
        url: item.url
      });
      if ((initial && !hasSelected) || (initial && item.status > 0) || (!initial && isChecked(item.id))) {
        item.selected = true;
        currentCheckeds.push(item.type + '-' + item.id)
      }
    });
    setTreeData(reusltData)
    onExpand([reusltData[0]?.key])

    if (initial) {
      setAllUserUrl(data);
      setCheckedCount(currentCheckeds.length);
    }
    setUserUrl(data);
    setCheckedKeys(currentCheckeds);

    setLoading(false);
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
    const data = allUserUrl.filter((item) => {
      return item.selected;
    })
    console.log(222222, data)
    uploadUserArticle(data);
    onLink(3)
  }

  const uploadUserArticle = (data: Array<IMergeData>) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_article', body: data }, (res) => {
      console.log('uploadUserArticle res:', res);
      initPagesInfo();
    });
  }

  const isChecked = (key: string | number) => {
    const result = allUserUrl.filter(item => item.id === key);
    return result[0]?.selected || false;
  }

  const searchKeyWord = (e: any) => {
    const searchText = e.target.value;
    if (searchText.trim() !== searchWord) {
      setSearchWord(e.target.value)
      setInitial(false)
    }
  }

  return (
    <div className={styles.container}>
      <Header tip={'Enable full-text search in browsing history to eliminate the need for memorization.'} note={'Only URLs of public articles, blogs, and essay PDFs can be included. Personal and work-related history are NOT included.'} />
      <div className={styles['content']}>
        <div className={styles['left']}>
          <div className={styles['back']} onClick={() => onLink(2)}>
            <ArrowLeftOutlined />
          </div>
        </div>
        <div className={styles['center']}>
          <div className={styles['header']}>
            <p>Public Knowledge Pages from Browsing History</p>
          </div>
          <div className={styles['control-box']}>
            <Input className={styles['search']} placeholder="Find items by keywords" prefix={<SearchOutlined />} onPressEnter={searchKeyWord} />
            <Checkbox className={styles['select']} onChange={onChange}>Select/Deselect All Shown</Checkbox>
          </div>
          <Spin spinning={loading} tip='Loading...' style={{ background: '#fff' }}>
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

          <p>* Current URL list is local only until you authorize data collection.</p>
        </div>
        <div className={styles['right']}>
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
            <span>Fetch {checkedCount} Items</span>
          </Button>
          <p className={styles['auto-add']}>
            <Switch checked={autoAdd} onChange={onChange} />
            <span>Auto-Collect New Matches</span>
          </p>
          <p className={styles['exclude-tip']}>Exclude  History</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryData;
