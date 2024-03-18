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
import GlobalContext, { ActionType, IBookmarks, IHistory, IReadingList } from '@/reducer/global';


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
  userinfo?: any;
}

const User: React.FC<Props> = () => {
  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { history, bookmarks, readinglist }, dispatch: globalDispatch } = useContext(GlobalContext);

  const treeData: TreeDataNode[] = [
    {
      title: '0-0',
      key: '0-0',
      children: [
        {
          title: '0-0-0',
          key: '0-0-0',
          children: [
            { title: '0-0-0-0', key: '0-0-0-0' },
            { title: '0-0-0-1', key: '0-0-0-1' },
            { title: '0-0-0-2', key: '0-0-0-2' },
          ],
        },
        {
          title: '0-0-1',
          key: '0-0-1',
          children: [
            { title: '0-0-1-0', key: '0-0-1-0' },
            { title: '0-0-1-1', key: '0-0-1-1' },
            { title: '0-0-1-2', key: '0-0-1-2' },
          ],
        },
        {
          title: '0-0-2',
          key: '0-0-2',
        },
      ],
    },
    {
      title: '0-1',
      key: '0-1',
      children: [
        { title: '0-1-0-0', key: '0-1-0-0' },
        { title: '0-1-0-1', key: '0-1-0-1' },
        { title: '0-1-0-2', key: '0-1-0-2' },
      ],
    },
    {
      title: '0-2',
      key: '0-2',
    },
  ];
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['0-0-0', '0-0-1']);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(['0-0-0']);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

  const onExpand = (expandedKeysValue: React.Key[]) => {
    console.log('onExpand', expandedKeysValue);
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeysValue: React.Key[]) => {
    console.log('onCheck', checkedKeysValue);
    setCheckedKeys(checkedKeysValue);
  };

  const onSelect = (selectedKeysValue: React.Key[], info: any) => {
    console.log('onSelect', info);
    setSelectedKeys(selectedKeysValue);
  };

  useEffect(() => {
    getUserUrl()
  }, []);

  const getUserUrl = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: 999, title: '' } }, (res) => {
      console.log('getUserUrl res:', res);
    });
  }

  const onChange = () => { }

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
          <Button className={styles['import-btn']} size="middle" type="primary" block onClick={() => { }}>
            <span>Import 456 Items</span>
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
            onSelect={onSelect}
            selectedKeys={selectedKeys}
            treeData={treeData}
          />
        </div>
        <p>* Data on the current page is local only. No URLs will be synchronized unless selected and submitted in further steps.</p>
      </div>
    </div>
  );
};

export default User;
