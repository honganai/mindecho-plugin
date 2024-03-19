import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Input, Checkbox, Tree } from 'antd';
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
  const { state: { upateData }, dispatch: globalDispatch } = useContext(GlobalContext);
  const [userUrl, setUserUrl] = useState<IMergeData[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(['bookmarks', 'readinglist', 'history']);
  //const [selectedKeys, setSelectedKeys] = useState<React.Key[]>(['bookmarks']);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [checkedCount, setCheckedCount] = useState<number>(0);

  const onExpand = (expandedKeysValue: React.Key[]) => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeysValue: React.Key[], event: any) => {
    console.log('onCheck', checkedKeysValue, event);
    const { checked, node } = event;
    setCheckedKeys(checkedKeysValue);
    setCheckedCount(checkedKeysValue.length)
  };

  // const onSelect = (selectedKeysValue: React.Key[], info: any) => {
  //   console.log('onSelect', info);
  //   setSelectedKeys(selectedKeysValue);
  // };

  useEffect(() => {
    getUserUrl()
  }, []);

  const getUserUrl = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: 999, title: '' } }, (res) => {
      console.log('getUserUrl res:', res);
      parsingData(res?.result)
    });
  }

  const parsingData = (data: any) => {
    const reusltData = [
      { title: 'Bookmarks', key: 'bookmarks', children: [] as any[] },
      { title: 'Reading List', key: 'readinglist', children: [] as any[] },
      { title: 'History', key: 'history', children: [] as any[] },
    ];
    data.forEach((item: any) => {
      item.status = 1;
      switch (item.type) {
        case 'bookmark':
          reusltData[0].children.push({
            title: item.title,
            key: reusltData[0].key + '-' + item.id,
            url: item.url
          });
          break;

        case 'readinglist':
          reusltData[1].children?.push({
            title: item.title,
            key: reusltData[1].key + '-' + item.id,
            url: item.url
          });
          break;

        case 'history':
          reusltData[2].children?.push({
            title: item.title,
            key: reusltData[1].key + '-' + item.id,
            url: item.url
          });
          break;
      }
    });
    setUserUrl(data)
    setCheckedCount(data.length)
    setTreeData(reusltData)
    onExpand(['bookmarks', 'readinglist'])
  }

  const onChange = () => { }

  const onImport = () => {
    console.log(checkedKeys)
    const data = userUrl.map((item, index) => {
      return {
        url: item.url,
        status: checkedKeys.some(checkedItem => checkedItem.split('-')[1] == item.id) ? 1 : 0,
      }
    })
    globalDispatch({
      type: ActionType.SetUpateData,
      payload: data as Array<IUpateData> || [],
    });
    onLink()
  }

  return (
    <div className={styles.container}>
      <div className={styles['userInfo']}>
        <img className={styles['logo']} src={logo} alt="logo" />
      </div>
      <div className={styles['content']}>
        <div className={styles['header']}>
          <div className={styles['back']}>
            <ArrowLeftOutlined />
          </div>
          <p>BookMarks & Reading Lists</p>
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
            <span>Import {checkedCount} Items</span>
          </Button>
        </div>
        <div className={styles['control-box']}>
          <Input className={styles['search']} placeholder="default size" prefix={<SearchOutlined />} />
          <Checkbox className={styles['select']} onChange={onChange}>Select/Deselect All Shown</Checkbox>
        </div>
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
        <p>* Data on the current page is local only. No URLs will be synchronized unless selected and submitted in further steps.</p>
      </div>
    </div>
  );
};

export default User;
