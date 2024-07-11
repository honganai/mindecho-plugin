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
import { buildTree, convertChromeBookmarkToTree, convertReadingListToTree, flattenTree, generateKey, mergeTrees } from '@/utils/treeHandler';
import CustomTree, { TreeNodeWithKey } from '@/pages/Options/components/CustomTree';
import { TreeNode as BaseTreeNode } from '@/utils/treeHandler';
import DoneStatus from '@/pages/Options/components/DoneStatus';
import FetchingStatus from '@/pages/Options/components/FetchingStatus';
import Header from '@/pages/Options/components/header/header';

const dayjs = require('dayjs');
const { getMessage: t } = chrome.i18n;

const fetchBookmarkFormChrome: () => Promise<chrome.bookmarks.BookmarkTreeNode[]> = async () => {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree: chrome.bookmarks.BookmarkTreeNode[]) => {
      resolve(tree)
    });
  })
}

const fetchReadingListFormChrome: () => Promise<IReadingListItemFormChrome[]> = async () => {
  return new Promise((resolve) => {
    // @ts-ignore
    chrome.readingList.query({}, (res) => resolve(res))
  })
}

export interface IBookmarksItemFormServer {
  id: number;
  user_id: number;
  title: string;
  url: string;
  type: string;
  status: number;
  user_create_time: Date;
  node_id: string;
  node_index: number;
  parentId: string;
  user_used_time: Date;
  properties: null;
  origin_info: string;
  url_hash_id: string;
  error_message: null;
  created_on: Date;
  changed_on: Date;
  article_content: string;
}

export interface IReadingListItemFormChrome {
  creationTime: number;
  hasBeenRead: boolean;
  lastUpdateTime: number;
  title: string;
  url: string;
}

const fetchDataFromServer: () => Promise<IBookmarksItemFormServer[]> = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'request',
      api: 'get_user_url',
      body:
      {
        page: 1,
        page_size: MAX_SIZE,
        title: '',
        type: 'bookmark,readinglist',
      }
    }, (res) => {
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
    getStorageAutoAdd().then((res) => setAutoAdd(!!res))
  }, [])

  useEffect(() => { !isNull(autoAdd) && setStorageAutoAdd(autoAdd) }, [autoAdd])

  useEffect(() => {
    setTreeData(searchKeyword.trim() === ''
      ? buildTree(flattenData)[0]?.children || []
      : flattenData
        .filter(
          item =>
            (item.title && item.title.includes(searchKeyword))
            || item.url && item.url.includes(searchKeyword)
        )
    )
    console.log("🚀 ~ useEffect ~ buildTree(flattenData):", buildTree(flattenData))

  }, [flattenData, searchKeyword])

  useEffect(() => {
    switch (step) {
      case Step.Checking:
        Promise.all([fetchBookmarkFormChrome(), fetchDataFromServer(), fetchReadingListFormChrome()])
          .then(([chromeBookMark, userBookMark, readingList]) => {
            const convertedChromeBookmarks = convertChromeBookmarkToTree(chromeBookMark)
            const flattenChromeBookmarks = flattenTree(convertedChromeBookmarks)
            const convertedReadingList = convertReadingListToTree(readingList)

            const chromeBookmarksWithKey = generateKey(flattenChromeBookmarks)
            const userBookMarkWithKey = generateKey(userBookMark)
            const readingListWithKey = generateKey(convertedReadingList)

            const chromeBookmarksKeys = chromeBookmarksWithKey.map(({ key }) => key)
            const readingListKey = readingListWithKey.map(({ key }) => key)
            const uploadedAndCheckKeys = userBookMarkWithKey
              .filter(({ status }) => status > 0)
              .map(({ key }) => key)
            const uploadedButUnCheckedKeys = userBookMarkWithKey
              .filter(({ status }) => status === 0)
              .map(({ key }) => key)

            setCheckedKeys([...chromeBookmarksKeys, ...readingListKey].filter(key => !(uploadedButUnCheckedKeys.includes(key) || key.includes('noUrl'))))
            setDisabledKeys(uploadedAndCheckKeys)

            setFlattenData(_.unionBy([
              ...readingListWithKey,
              ...chromeBookmarksWithKey,
              ...userBookMarkWithKey,
              {
                id: 'readingList',
                key: 'noUrlReadingList',
                title: t('reading_list'),
                parentId: '0',
                url: undefined,
                children: readingListWithKey,
              }
            ], 'key'))

          }).finally(() => setFetchingTree(false));
        break;
      case Step.Uploading:
        const payloadBody = flattenData
          .filter(({ url, key = '' }) => (
            checkedKeys.includes(key)
            && url &&
            !disabledKeys.includes(key)
          ))
          .map((item) => {
            return {
              title: item.title,
              url: item.url,
              type: 'bookmark',
              user_create_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
              user_used_time: dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
              node_id: '',
              node_index: '',
              status: 1,
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
                checked={importCount > 0}
                indeterminate={flattenData.filter(({ key = '' }) => !([...checkedKeys, ...disabledKeys].includes(key) || key.includes('noUrl'))).length !== 0}
                onChange={
                  (e) => setCheckedKeys(
                    e
                      ? flattenData
                        .filter(({ key = '' }) => !disabledKeys.includes(key))
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

        <div className="flex items-center mt-4">
          <CheckboxField className=''>
            <Checkbox
              onChange={(e) => setAutoAdd(e)}
              checked={!!autoAdd}
            />

            <Label>
              <span className='font-bold mr-2'>{t('auto_sync')}</span>
              <span className='text-gray-500'>{t('automatically_import_new_items_in_bookmarks_and_reading_list')}</span>
            </Label>
          </CheckboxField>
        </div>

        <div className='flex justify-end items-center mt-2'>
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
      </>
    }
    {step === Step.Uploading && <FetchingStatus
      countdown={importCount >= 2000 ? 60 * 60 : importCount}
      onOver={() => setStep(Step.Done)}
    />}
    {step === Step.Done && <DoneStatus />}

  </div>)
};

export default BrowserData;
