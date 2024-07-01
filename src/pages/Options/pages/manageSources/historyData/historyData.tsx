import React, { useEffect, useContext, useState } from 'react';
import _, { isEqual } from "lodash";
import GlobalContext, { ActionType, IUpdateData, IBookmarks } from '@/reducer/global';
import { setAutoAdd as setStorageAutoAdd, initPagesInfo, getPagesInfo, setPagesInfo, setAllPagesInfo } from '@/constants';
import { MAX_SIZE } from '@/utils/common.util';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Checkbox, CheckboxField } from '@/pages/Options/components/catalyst/checkbox'
import { Label } from '@/pages/Options/components/catalyst/fieldset'
import { Button } from '@/pages/Options/components/catalyst/button'

import { Input } from '@/pages/Options/components/catalyst/input'
import { TreeNode, buildTree, convertChromeBookmarkToTree, convertHistoryToTree, flattenTree, generateKey, mergeTrees } from '@/utils/treeHandler';
import CustomTree, { TreeNodeWithKey } from '@/pages/Options/components/CustomTree';
import { TreeNode as BaseTreeNode } from '@/utils/treeHandler';
import DoneStatus from '@/pages/Options/components/DoneStatus';
import FetchingStatus from '@/pages/Options/components/FetchingStatus';

enum Step {
  Checking,
  Uploading,
  Done,
}

const { getMessage: t } = chrome.i18n;

export interface HistoryData {
  author: string;
  content: string;
  id: number;
  node_id: number;
  node_index: number;
  origin_info: string;
  parentId: number;
  status: number;
  title: string;
  type: string;
  url: string;
  user_create_time: Date;
  user_used_time: Date;
}[]

const BrowserData: React.FC<{
  userinfo?: any;
}> = ({ }) => {
  const navigate = useNavigate();
  const [flattenData, setFlattenData] = useState<BaseTreeNode[]>([]);
  const [treeData, setTreeData] = useState<BaseTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [autoAdd, setAutoAdd] = useState<boolean>(true);
  const [fetchingTree, setFetchingTree] = useState<boolean>(true);
  const [step, setStep] = useState<Step>(Step.Checking);

  useEffect(() => {
    setStorageAutoAdd(autoAdd);
  }, [autoAdd])

  useEffect(() => {
    if (treeData.length === 0) return;
    if (searchKeyword.trim() === '') return

    setFlattenData(flattenData.filter(item => item.title && item.title.includes(searchKeyword)))
  }, [searchKeyword]);

  useEffect(() => {
    setTreeData([{
      key: 'root',
      title: 'root',
      id: '0',
      children: flattenData
    }])
  }, [flattenData])

  useEffect(() => {
    switch (step) {
      case Step.Checking:
        getPagesInfo().then(async (pagesInfo: HistoryData[]) => {

          const historyData = convertHistoryToTree(pagesInfo)
          const historyWithKey = generateKey(historyData)
          const uniqueHistory = _.uniqBy(historyWithKey, 'key')
          setCheckedKeys(uniqueHistory.map(({ key = '' }) => key).filter(item => item))
          setFlattenData(uniqueHistory)
        }).finally(() => setFetchingTree(false));

        // initPagesInfo()
        setStorageAutoAdd(autoAdd);
        break;
      case Step.Uploading:

        getPagesInfo().then(async (pagesInfo: HistoryData[]) => {
          const payloadBody = generateKey(
            pagesInfo.map(item => ({
              ...item,
              parentId: item.parentId.toString()
            }))
          ).filter(
            ({ title = '', url = '', status }) => status === -1 && checkedKeys.includes(url || 'noUrl' + title || 'noTitle')
          )

          chrome.runtime.sendMessage({
            type: 'request',
            api: 'upload_user_article',
            body: payloadBody.map(({
              author,
              node_id,
              node_index,
              origin_info,
              parentId,
              title,
              type,
              url,
              user_create_time,
              content
            }) => ({
              title,
              url,
              type,
              user_create_time,
              node_id,
              node_index,
              parentId,
              user_used_time: new Date().toISOString(),
              origin_info,
              author,
              content,
              status: 3,
            }))
          }, async (res) => {
            await setAllPagesInfo(payloadBody.map(item => ({ ...item, status: 3 })))
            setStep(Step.Done)
          });
        })

        break;
      case Step.Done:
        console.log("🚀 ~ useEffect ~ Step.Done:", Step.Done)
        break;
      default:
        break;
    }
  }, [step])


  return (<div className={clsx(
    'flex flex-col h-full',
  )}>
    <div className="font-bold text-lg text-black">{t('public_content_from_browser_history')}</div>
    <div className="mt-2">{t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization')}</div>
    <div className="text-gray-700">
      <span className="font-bold text-gray-950">{t('Note')}</span>
      {t('only_URLs_of_public_articles_blogs_and_essay_PDFs_can_be_included_personal_and_work_related_history_are_NOT_included')}</div>

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
              : (treeData?.[0]?.children ?? []).length ?
                <CustomTree
                  checkedKeys={checkedKeys}
                  onCheck={(newCheckedKeys) => !isEqual(newCheckedKeys, checkedKeys) && setCheckedKeys(newCheckedKeys)}
                  treeData={(treeData[0].children || []) as TreeNodeWithKey[]}
                />
                : <div className="text-center">{t('no_data_available')}</div>
          }
        </div>

        <div className="flex items-center justify-between mt-4">
          <CheckboxField className=''>
            <Checkbox
              onChange={(e) => setAutoAdd(e)}
              checked={autoAdd}
            />
            <Label>
              {t('automatically_import_new_items_in_bookmarks_and_reading_list')}
            </Label>
          </CheckboxField>

          <div className='flex'>
            <Button outline onClick={() => navigate('/manage-sources')}>
              {t('cancel')}
            </Button>
            <Button
              disabled={!checkedKeys.length}
              className='ml-4'
              onClick={() => checkedKeys.length && setStep(Step.Uploading)}
            >
              {`${t('import')} ${checkedKeys.length} ${t('selected_urls')}`}
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
