import React, { useEffect, useContext, useState } from 'react';
import _, { isEqual } from "lodash";
import GlobalContext, { ActionType, IUpdateData, IBookmarks } from '@/reducer/global';
import { setAutoAdd as setStorageAutoAdd, setLastUpdateDataTime } from '@/constants';
import { MAX_SIZE } from '@/utils/common.util';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Checkbox, CheckboxField, CheckboxGroup } from '@/pages/Options/components/catalyst/checkbox'
import { Label } from '@/pages/Options/components/catalyst/fieldset'
import { Button } from '@/pages/Options/components/catalyst/button'

import { Input } from '@/pages/Options/components/catalyst/input'
import { TreeNode, buildTree, flattenTree, mergeTrees } from '@/utils/treeHandler';
import CustomTree from '@/pages/Options/components/CustomTree';
import { TreeDataNode } from '@/pages/Options/components/CustomTree';

export enum SubType {
  Free = 'free',
  Premium = 'premium',
  Elite = 'elite',
}

interface Props {
  userinfo?: any;
}

const fetchDataFormChrome = async () => {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      resolve(tree[0] as IBookmarks || {})
    });
  })
}

const fetchDataFromServer = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: MAX_SIZE, title: '', type: 'bookmark,readinglist' } }, (res) => {
      console.log('🚀 ~ datalist -获取用户上传数据- line:240: ', res);
      resolve(res?.result || [])
    });
  })
}

const BrowserData: React.FC<Props> = ({ }) => {
  const navigate = useNavigate();
  const { getMessage: t } = chrome.i18n;
  const { state: { bookmarks: bookmarksData }, dispatch: globalDispatch } = useContext(GlobalContext);

  const [flattenData, setFlattenData] = useState<TreeDataNode[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [autoAdd, setAutoAdd] = useState<boolean>(true);

  useEffect(() => {
    console.log("🚀 ~ bookmarksData:", bookmarksData)

  }, [bookmarksData])

  useEffect(() => {
    Promise.all([fetchDataFormChrome(), fetchDataFromServer()]).then(([chromeBookMark, userBookMark]) => {
      const mergeTree = mergeTrees([chromeBookMark] as TreeNode[], userBookMark as TreeNode[])
      setCheckedKeys((userBookMark as TreeNode[]).map(({ url, title }) => url + title) || [])
      setFlattenData(flattenTree(mergeTree) as unknown as TreeDataNode[])
    })
    //初始默认勾选自动更新
    setStorageAutoAdd(autoAdd);
  }, [])

  useEffect(() => {
    if (treeData.length === 0) return;
    if (searchKeyword.trim() === '') return

    setFlattenData(flattenData.filter(item => item.title.includes(searchKeyword)))
  }, [searchKeyword]);

  useEffect(() => {
    setTreeData(
      buildTree(flattenData as unknown as TreeNode[]) as unknown as TreeDataNode[]
    )
  }, [flattenData])

  const onImport = () => {
    const data = checkedKeys.map((item) => {
      const checkOne = flattenData.find(({ key }) => key === item)
      return {
        status: 1,
        url: checkOne?.url,
      }
    })
    globalDispatch({
      type: ActionType.SetUpdateData,
      payload: data as Array<IUpdateData> || [],
    });
    setLastUpdateDataTime(new Date().getTime());
    navigate('/manage-sources/history-data')
  }

  return (
    <div className={clsx(
      'flex flex-col h-full',
    )}>
      <div className="font-bold text-lg text-black">{t('bookMarks_reading_lists')}</div>
      <div className="mt-2">{t('automatically_public_articles_news_blogs_and_essays_from_current_open_tabs')}</div>

      <div className="shrink mt-4 min-w-[300px] items-start justify-center border-y border-zinc-200 bg-white sm:max-w-full sm:rounded-lg sm:border dark:border-white/10 dark:bg-zinc-900 p-4 max-h-[75vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <Input
            className={clsx('!w-96')}
            name="search"
            aria-label="Search"
            placeholder={t('find_items_by_keywords')}
            onKeyDown={
              (e) => e.key === 'Enter' && setSearchKeyword((e.target as HTMLInputElement).value)
            }
          />

          <CheckboxField className=''>
            <Checkbox
              checked={checkedKeys.length === flattenData.length || checkedKeys.length > 0}
              indeterminate={checkedKeys.length !== flattenData.length}
              onChange={(e) => setCheckedKeys(e ? flattenData.map(({ key }) => key) : [])}
            />
            <Label>{t('select_deselect_all_shown')}</Label>
          </CheckboxField>
        </div>

        {
          treeData.length ?
            <CustomTree
              checkedKeys={checkedKeys}
              onCheck={(newCheckedKeys) => !isEqual(newCheckedKeys, checkedKeys) && setCheckedKeys(newCheckedKeys)}
              treeData={treeData[0].children || []}
            />
            : <div className="text-center">{t('loading')}</div>
        }
      </div>

      <div className="flex items-center justify-between mt-4">
        <CheckboxField className=''>
          <Checkbox onChange={() => setAutoAdd(true)} name="discoverability" value="show_on_events_page" defaultChecked />
          <Label>{t('automatically_import_new_items_in_bookmarks_and_reading_list')}</Label>
        </CheckboxField>

        <div className='flex'>
          <Button outline onClick={() => navigate('/manage-sources')}>
            {t('cancel')}
          </Button>
          <Button className='ml-4' onClick={onImport}>
            {`${t('import')} ${checkedKeys.length} ${t('selected_urls')}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrowserData;
