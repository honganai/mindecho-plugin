import React, { useEffect, useState } from 'react';
import { Tree } from 'antd';
import 'antd/dist/antd.css';
import { Checkbox, CheckboxField } from '@/pages/Options/components/catalyst/checkbox'
import { Description, Label } from '@/pages/Options/components/catalyst/fieldset'
const { TreeNode } = Tree;
const { getMessage: t } = chrome.i18n;
import { TreeNode as TreeNodeWithOutKey } from '@/utils/treeHandler';

export interface TreeNodeWithKey extends TreeNodeWithOutKey {
  key: string;
  children?: TreeNodeWithKey[]
}

interface CustomTreeProps {
  treeData: TreeNodeWithKey[];
  onCheck: (checkedKeys: string[], halfCheckedKeys: string[]) => void;
  checkedKeys: string[];
}

const CustomTree: React.FC<CustomTreeProps> = ({ treeData, onCheck, checkedKeys }) => {
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<string[]>([]);

  const handleCheck = (checkedKeys: string[], halfCheckedKeys: string[]) => {
    setHalfCheckedKeys(halfCheckedKeys);
    onCheck(checkedKeys, halfCheckedKeys);
  };

  const renderTreeNodes = (data: TreeNodeWithKey[]) =>
    data.map((item) => {
      return (
        <TreeNode key={item.key} title={renderTitle(item)}>
          {item.children && renderTreeNodes(item.children)}
        </TreeNode>
      );
    });

  const renderTitle = (item: TreeNodeWithKey) => {
    return (
      <CheckboxField className='my-1 w-full'>
        <Checkbox
          checked={checkedKeys.includes(item.key) || halfCheckedKeys.includes(item.key)}
          indeterminate={halfCheckedKeys.includes(item.key)}
          onChange={(checked: Boolean) => onCheckBoxChange(checked, item.key)}
        />
        <Label className=' line-clamp-1'>{item.title || t('no_name_item')}</Label>
        <Description className=' line-clamp-2'>{item.url}</Description>
      </CheckboxField>
    );
  };

  const onCheckBoxChange = (checked: Boolean, key: string) => {
    let newCheckedKeys = [...checkedKeys];

    if (checked) {
      newCheckedKeys = addKeyAndChildren(newCheckedKeys, key);
    } else {
      newCheckedKeys = removeKeyAndChildren(newCheckedKeys, key);
    }

    const { checkedKeys: finalCheckedKeys, halfCheckedKeys: finalHalfCheckedKeys } = updateParentCheckState(newCheckedKeys);
    handleCheck(finalCheckedKeys, finalHalfCheckedKeys);
  };

  const addKeyAndChildren = (keys: string[], key: string): string[] => {
    let newKeys = [...keys, key];
    const addChildren = (nodeKey: string) => {
      const node = findNode(treeData, nodeKey);
      if (node?.children) {
        node.children.forEach((child) => {
          newKeys = addKeyAndChildren(newKeys, child.key);
        });
      }
    };
    addChildren(key);
    return newKeys;
  };

  const removeKeyAndChildren = (keys: string[], key: string): string[] => {
    let newKeys = keys.filter((k) => k !== key);
    const removeChildren = (nodeKey: string) => {
      const node = findNode(treeData, nodeKey);
      if (node?.children) {
        node.children.forEach((child) => {
          newKeys = removeKeyAndChildren(newKeys, child.key);
        });
      }
    };
    removeChildren(key);
    return newKeys;
  };

  const findNode = (data: TreeNodeWithKey[], key: string): TreeNodeWithKey | null => {
    let result: TreeNodeWithKey | null = null;
    for (let item of data) {
      if (item.key === key) {
        result = item;
        break;
      }
      if (item.children) {
        result = findNode(item.children, key);
        if (result) break;
      }
    }
    return result;
  };

  const updateParentCheckState = (checkedKeys: string[]) => {
    const checkedKeySet = new Set(checkedKeys);
    console.log("🚀 ~ updateParentCheckState ~ checkedKeys:", checkedKeys)
    const halfCheckedKeySet = new Set<string>();
    console.log("🚀 ~ updateParentCheckState ~ halfCheckedKeySet:", halfCheckedKeySet)

    const checkParent = (node: TreeNodeWithKey) => {
      if (node?.children?.length) {

        let allCount = node.children.length
        let checkedCount = 0
        node.children.forEach((child) => {

          checkParent(child);

          if (checkedKeySet.has(child.key)) {
            checkedCount++
          }

          if (halfCheckedKeySet.has(child.key)) {
            checkedCount += 0.5
          }
        });

        if (checkedCount === allCount) {
          checkedKeySet.add(node.key);
        } else if (checkedCount > 0) {
          halfCheckedKeySet.add(node.key);
        }
      }
    };

    treeData.forEach(checkParent);

    return {
      checkedKeys: Array.from(checkedKeySet),
      halfCheckedKeys: Array.from(halfCheckedKeySet),
    };
  };

  useEffect(() => {
    const { checkedKeys: finalCheckedKeys, halfCheckedKeys: finalHalfCheckedKeys } = updateParentCheckState(checkedKeys);
    handleCheck(finalCheckedKeys, finalHalfCheckedKeys);
  }, [checkedKeys])

  return (
    <Tree className='w-full' checkable={false} defaultExpandAll>
      {renderTreeNodes(treeData)}
    </Tree>
  );
};

export default CustomTree;
