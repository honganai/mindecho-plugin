import { HistoryData } from '@/pages/Options/pages/manageSources/historyData/historyData';
import { TweetItem } from '@/pages/Options/pages/manageSources/twitter/type';
import _ from 'lodash';

export interface TreeNode {
  id: string | number;
  key?: string;
  url?: string;
  title?: string;
  parentId?: string | string;
  dateAdded?: number;
  username?: string;
  isUpdate?: boolean;
  children?: TreeNode[];
}

type Tree<T extends TreeNode> = T[];

/**
 * 将树结构扁平化为节点数组
 * @param {Tree<T>} tree - 树结构数组
 * @return {Tree<T>} - 扁平化的节点数组
 */
export function flattenTree<T extends TreeNode>(tree: Tree<T>): Tree<T> {
  const result: Tree<T> = [];

  function recurse(nodes: Tree<T>) {
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        recurse(node.children as Tree<T>);
      }
    }
  }

  recurse(tree);
  return result;
}

/**
 * 将对象数组根据 parentId 属性处理成树状结构
 * @param {Tree<T>} items - 输入的对象数组
 * @param {string | null} parentId - 父节点的 ID
 * @return {Tree<T>} - 树状结构的数组
 */
export function buildTree<T extends TreeNode>(items: Tree<T>, parentId: string | number | null = null): Tree<T> {
  const groupedItems = _.groupBy(items, 'parentId');
  const buildNode = (parentId: string | number | null): Tree<T> => {
    return ((parentId && groupedItems[parentId]) || []).map((item) => ({
      ...item,
      children: buildNode(item.id),
    }));
  };

  // 处理第一级节点没有 parentId 的情况
  const rootNodes = items.filter((item) => item.parentId === undefined || item.parentId === null);
  return rootNodes.map((node) => ({
    ...node,
    children: buildNode(node.id),
  }));
}

/**
 * 为树结构数组中的每个节点生成 key 属性
 * @param arr {Tree<T>} - 树结构数组
 * @returns {Tree<TreeNodeWithKey>} - 生成 key 属性后的树结构数组
 */
export const generateKey: <T extends TreeNode>(arr: Tree<T>) => Tree<T> = (arr) => {
  return arr.map((item) => ({
    ...item,
    key: item.url || 'noUrl' + item.title || 'noTitle',
  }));
};

/**
 * 合并两个树结构数组，并根据 id 进行覆盖
 * @param {Tree<T>} tree1 - 第一个树结构数组
 * @param {Tree<T>} tree2 - 第二个树结构数组
 * @return {Tree<T>} - 合并后的树结构数组
 */
export function mergeTrees<T extends TreeNode>(tree1: Tree<T>, tree2: Tree<T>): Tree<T> {
  const flatTree1 = flattenTree(tree1);
  const flatTree2 = flattenTree(tree2);

  // 合并扁平化的节点数组，后来的覆盖前面的
  const mergedFlatTree = _.unionBy(generateKey(flatTree2), generateKey(flatTree1), 'id');

  // 重新构建树结构
  return buildTree(mergedFlatTree);
}

/**
 * 将 Chrome 书签节点转换为通用的 TreeNode
 * @param bookmarks
 * @returns
 */
export function convertChromeBookmarkToTree(bookmarks: chrome.bookmarks.BookmarkTreeNode[]): TreeNode[] {
  return bookmarks.map((bookmark) => {
    const { id, title, url, parentId, dateAdded, children } = bookmark;
    return {
      id,
      title,
      url,
      parentId,
      dateAdded,
      children: children ? convertChromeBookmarkToTree(children) : [],
    };
  });
}

/**
 * 将历史记录数据转换为通用的 TreeNode
 * @param history
 * @returns
 */
export function convertHistoryToTree(history: HistoryData[]): TreeNode[] {
  return history.map((item) => {
    const { id, title, url, parentId, user_create_time } = item;
    return {
      id,
      title,
      url,
      parentId: String(parentId),
      dateAdded: new Date(user_create_time).getTime(),
    };
  });
}

/**
 * 将推特书签数据转换为通用的 TreeNode
 * @param tree
 * @returns
 */
export function convertXBookmarkToTree(tree: TweetItem[]): TreeNode[] {
  return tree.map((item) => {
    const { id, title, url, parentId, user_create_time, isUpdate } = item;
    return {
      id,
      title,
      url,
      parentId,
      username: item.author,
      isUpdate,
      key: id,
      dateAdded: new Date(user_create_time).getTime(),
    };
  });
}
