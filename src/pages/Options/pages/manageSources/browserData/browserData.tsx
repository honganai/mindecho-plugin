import React, { useEffect, useContext, useState } from 'react';
import _, { isEqual, isNull } from "lodash";
import GlobalContext, { ActionType, IUpdateData, IBookmarks } from '@/reducer/global';
import { setAutoAdd as setStorageAutoAdd, getAutoAdd as getStorageAutoAdd, setLastUpdateDataTime } from '@/constants';
import { MAX_SIZE } from '@/utils/common.util';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Checkbox, CheckboxField } from '@/pages/Options/components/catalyst/checkbox'
import { Label } from '@/pages/Options/components/catalyst/fieldset'
import { Button } from '@/pages/Options/components/catalyst/button'

import { Input } from '@/pages/Options/components/catalyst/input'
import { buildTree, convertChromeBookmarkToTree, flattenTree, generateKey, mergeTrees } from '@/utils/treeHandler';
import CustomTree, { TreeNodeWithKey } from '@/pages/Options/components/CustomTree';
import { TreeNode as BaseTreeNode } from '@/utils/treeHandler';
import DoneStatus from '@/pages/Options/components/DoneStatus';
import FetchingStatus from '@/pages/Options/components/FetchingStatus';
import Header from '@/pages/Options/components/header/header';

const dayjs = require('dayjs');
const { getMessage: t } = chrome.i18n;

const fetchDataFormChrome: () => Promise<chrome.bookmarks.BookmarkTreeNode[]> = async () => {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree: chrome.bookmarks.BookmarkTreeNode[]) => {
      resolve(tree)
    });
  })
}

const fetchDataFromServer: () => Promise<IBookmarks[]> = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'request',
      api: 'get_user_url',
      body:
      {
        page: 1,
        page_size: MAX_SIZE,
        title: '',
        type: 'bookmark'
      }
    }, (res) => {
      console.log('🚀 ~ datalist -获取用户上传数据- line:240: ', res);
      resolve(res?.result || [])
    });
  })
}

enum Step {
  Checking,
  Uploading,
  Done,
}

const BrowserData: React.FC<{
  userinfo?: any;
}> = ({ }) => {
  const navigate = useNavigate();
  const [flattenData, setFlattenData] = useState<BaseTreeNode[]>([]);
  const [treeData, setTreeData] = useState<BaseTreeNode[]>([]);
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [autoAdd, setAutoAdd] = useState<boolean | null>(null);
  const [fetchingTree, setFetchingTree] = useState<boolean>(true);
  const [step, setStep] = useState<Step>(Step.Checking);

  useEffect(() => {
    getStorageAutoAdd().then((res) => setAutoAdd(res))
  }, [])

  useEffect(() => { !isNull(autoAdd) && setStorageAutoAdd(autoAdd) }, [autoAdd])

  useEffect(() => setTreeData(searchKeyword.trim() === ''
    ? buildTree(flattenData)[0]?.children || []
    : flattenData
      .filter(
        item =>
          (item.title && item.title.includes(searchKeyword))
          || item.url && item.url.includes(searchKeyword)
      )
  ), [flattenData, searchKeyword])

  useEffect(() => {
    switch (step) {
      case Step.Checking:
        Promise.all([fetchDataFormChrome(), fetchDataFromServer()])
          .then(([chromeBookMark, userBookMark]) => {
            const convertedChromeBookmarks = convertChromeBookmarkToTree(chromeBookMark)
            const flattenChromeBookmarks = flattenTree(convertedChromeBookmarks)

            const chromeBookmarksWithKey = generateKey(flattenChromeBookmarks)
            const userBookMarkWithKey = generateKey(userBookMark) as { key: string }[] & IBookmarks[]

            setFlattenData(_.unionBy(
              chromeBookmarksWithKey,
              userBookMarkWithKey,
              'key'
            ))

            const uploadedKeys = userBookMarkWithKey
              .filter(({ key = '' }) => key)
              .map(({ key = '' }) => key) || []

            setCheckedKeys([...uploadedKeys, ...autoAdd ? userBookMarkWithKey.map(({ key }) => key) : []])
            setDisabledKeys(uploadedKeys)
          }).finally(() => setFetchingTree(false));
        break;
      case Step.Uploading:
        const payloadBody = flattenData
          .filter(({ url }) => url)
          .map((item) => {
            return {
              title: item.title,
              url: item.url,
              type: 'bookmark',
              user_create_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
              user_used_time: dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
              node_id: '',
              node_index: '',
              parentId: '',
              origin_info: item,
            }
          })

        chrome.runtime.sendMessage({
          type: 'request',
          api: 'upload_user_url',
          body: payloadBody
        }).then((res) => {
          setLastUpdateDataTime(new Date().getTime());
          setTimeout(() => {
            setStep(Step.Done)
          }, 1000 * 60)
        });

        break;
      case Step.Done:
        console.log("🚀 ~ useEffect ~ Step.Done:", Step.Done)
        break;
      default:
        break;
    }
  }, [step])

  const [importCount, setImportCount] = useState(0)
  useEffect(() => {
    setImportCount(checkedKeys
      .filter(key =>
        !disabledKeys.includes(key)
        &&
        flattenData.find(({ key: k }) => k === key)?.url
      ).length)
  }, [checkedKeys, disabledKeys, flattenData])

  return (<div className={clsx(
    'flex flex-col h-full',
  )}>
    {step !== Step.Done && <Header />}

    {
      step === Step.Checking
      && <>
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
                onChange={
                  (e) => setCheckedKeys(
                    e
                      ? flattenData
                        .filter(({ key = '' }) => key)
                        .map(({ key = '' }) => key)
                      : []
                  )
                }
              />
              <Label>{t('select_deselect_all_shown')}</Label>
            </CheckboxField>
          </div>
          {
            fetchingTree
              ? <div className="text-center">{t('loading')}</div>
              : treeData.length ?
                <CustomTree
                  disabledKeys={disabledKeys}
                  checkedKeys={checkedKeys}
                  onCheck={(newCheckedKeys) => !isEqual(newCheckedKeys, checkedKeys) && setCheckedKeys(newCheckedKeys)}
                  treeData={(treeData || []) as TreeNodeWithKey[]}
                />
                : <div className="text-center">{t('no_data_available')}</div>
          }
        </div>

        <div className="flex items-center justify-between mt-4">
          <CheckboxField className=''>
            <Checkbox
              onChange={(e) => setAutoAdd(e)}
              checked={!!autoAdd}
            />
            <Label>{t('automatically_import_new_items_in_bookmarks_and_reading_list')}</Label>
          </CheckboxField>

          <div className='flex'>
            <Button outline onClick={() => navigate('/manage-sources')}>
              {t('cancel')}
            </Button>
            <Button
              disabled={!importCount}
              className='ml-4'
              onClick={() => importCount && setStep(Step.Uploading)}
            >
              {`${t('import')} ${importCount} ${t('selected_urls')}`}
            </Button>
          </div>
        </div>
      </>
    }
    {step === Step.Uploading && <FetchingStatus />}
    {step === Step.Done && <DoneStatus />}

  </div>)
};

export default BrowserData;
