import React, { useEffect, useContext, useState } from 'react';
import dayjs from 'dayjs';
import { Tree, Result, TreeDataNode } from 'antd';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";

interface Props {
  onExpand: (expandedKeysValue: React.Key[]) => void;
  expandedKeys: React.Key[];
  autoExpandParent: boolean;
  onCheck: (checkedKeysValue: React.Key[]) => void;
  onSelect: (selectedKeysValue: React.Key[], info: any) => void;
  checkedKeys: React.Key[];
  treeData: TreeDataNode[];
}

const DataList: React.FC<Props> = ({ onExpand, expandedKeys, autoExpandParent, onCheck, onSelect, checkedKeys, treeData }) => {
  const noDataFoundI18N = chrome.i18n.getMessage('noDataFound');

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
        <div style={{ cursor: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <span style={{ marginLeft: 8 }}>{nodeData.title}</span>
        </div>
      );
    }
  };

  return (
    <div className={styles['list-box']}>
      {
        treeData.length > 0 ?
          <Tree
            className={styles.treeList}
            checkable
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onCheck={onCheck}
            checkedKeys={checkedKeys}
            onSelect={onSelect}
            //selectedKeys={selectedKeys}
            treeData={treeData}
            titleRender={titleRender}
          />
          :
          <Result
            title={noDataFoundI18N}
          />
      }

    </div>
  );
};

export default DataList;
