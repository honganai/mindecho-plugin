import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Tree, Spin, message, Switch, TreeDataNode } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, LockOutlined } from '@ant-design/icons';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import GlobalContext, { ActionType, IUpateData, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import Header from '../header/header';
import { setAutoAdd as setStorageAutoAdd, setLastUpateDataTime_pocket } from '@/constants';
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

const Pocket: React.FC<Props> = ({ onLink }) => {
  const noDataFoundI18N = chrome.i18n.getMessage('noDataFound');
  const logoutText = chrome.i18n.getMessage('logout');
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
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: 999, title: searchWord, type: 'pocket' } }, (res) => {
      console.log('🚀 ~ pocket -获取用户上传数据- line:240: ', res);
      parsingData(res?.result || [])
      // if (res?.result?.length > 0) {
      //   parsingData(res?.result)
      // } else {
      //   message.error(noDataFoundI18N);
      //   setLoading(false);
      // }
    });
  }

  const parsingData = (data: any) => {
    // const pockets = data.filter((item: any) => item.type === 'pocket');
    const pockets = data;
    const reusltData: Array<TreeDataNode> = [];
    let reusltDataMap = {} as any;

    const currentCheckeds: string[] = [];
    const hasSelected = pockets.some((item: any) => item.status > 0);

    pockets?.forEach((item: any) => {
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
      setAllUserUrl(pockets);
      setCheckedCount(currentCheckeds.length);
      setInitial(false);
    }
    setUserUrl(pockets);
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
    setLastUpateDataTime_pocket(new Date().getTime());
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

  const titleRender = (nodeData: any) => {
    if (nodeData.url) {
      return (
        <div className={styles.items}>
          <p className={styles['title']}>{nodeData.title}</p>
          <p className={styles['url']}>{nodeData.url}</p>
        </div>
      );
    } else {
      return (
        <div>
          <span style={{ marginLeft: 8 }}>{nodeData.title}</span>
        </div>
      );
    }
  };

  return (
    <div className={styles.container}>
      <Header tip={'Connect to Pocket to revive your dusty stash.'} />
      <div className={styles['content']}>
        <div className={styles['left']}>
          <div className={styles['back']} onClick={() => onLink(1)}>
            <ArrowLeftOutlined />
          </div>
        </div>
        <div className={styles['center']}>
          <div className={styles['header']}>
            <p><span style={{ color: '#e94554' }}>Pocket</span> Saves</p>
          </div>
          <div className={styles['control-box']}>
            <Input className={styles['search']} placeholder="Find items by keywords" prefix={<SearchOutlined />} onPressEnter={searchKeyWord} />
            <Checkbox className={styles['select']} onChange={onChange}>Select/Deselect All Shown</Checkbox>
          </div>
          <Spin spinning={loading} tip='Loading...' style={{ background: '#fff' }}>
            {/* <div className={styles['list-box']}>
              <Tree
                className={styles.treeList}
                checkable
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onCheck={onCheck}
                checkedKeys={checkedKeys}
                treeData={treeData}
                titleRender={titleRender}
              /> 
            </div> */}
            <DataList
              checkable
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onCheck={onCheck}
              checkedKeys={checkedKeys}
              treeData={treeData} />
          </Spin>

          <p style={{ textAlign: 'right' }}><LockOutlined /> Secure Connection</p>
        </div>
        <div className={styles['right']}>
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
            <span>Fetch {checkedCount} Items</span>
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

export default Pocket;
