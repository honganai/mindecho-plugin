import _ from 'lodash';

export interface TreeNode {
  id: string;
  parentId: string | null;
  url: string;
  title: string;
  key?: string;
  children?: TreeNode[];
}

type TreeData<T extends TreeNode> = T[];

/**
 * 将树结构扁平化为节点数组
 * @param {TreeData<T>} tree - 树结构数组
 * @return {TreeData<T>} - 扁平化的节点数组
 */
export function flattenTree<T extends TreeNode>(tree: TreeData<T>): TreeData<T> {
  const result: TreeData<T> = [];

  function recurse(nodes: TreeData<T>) {
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        recurse(node.children as TreeData<T>);
      }
    }
  }

  recurse(tree);
  return result;
}

/**
 * 将对象数组根据 parentId 属性处理成树状结构
 * @param {TreeData<T>} items - 输入的对象数组
 * @param {string | null} parentId - 父节点的 ID
 * @return {TreeData<T>} - 树状结构的数组
 */
export function buildTree<T extends TreeNode>(
  items: TreeData<T>,
  parentId: string | number | null = null,
): TreeData<T> {
  const groupedItems = _.groupBy(items, 'parentId');
  const buildNode = (parentId: string | number | null): TreeData<T> => {
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
 * 合并两个树结构数组，并根据 id 进行覆盖
 * @param {TreeData<T>} tree1 - 第一个树结构数组
 * @param {TreeData<T>} tree2 - 第二个树结构数组
 * @return {TreeData<T>} - 合并后的树结构数组
 */
export function mergeTrees<T extends TreeNode>(tree1: TreeData<T>, tree2: TreeData<T>): TreeData<T> {
  const flatTree1 = flattenTree(tree1);
  const flatTree2 = flattenTree(tree2);

  // 合并扁平化的节点数组，后来的覆盖前面的
  const mergedFlatTree = _.unionBy(flatTree2, flatTree1, ({ url, title }) => url + title);
  mergedFlatTree.forEach((item) => (item.key = item.url + item.title));

  // 重新构建树结构
  return buildTree(mergedFlatTree);
}
