import React, { useEffect, useState } from 'react';
import _, { isEqual, isNull } from "lodash";
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { TweetResultsResult, TweetItem, TwitterResult, XBookmarkHeaders } from './type';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getLocalStorage, setLocalStorage } from './storage';
import ConfirmStatus from './ConfirmStatus';
import { TreeNode as BaseTreeNode, convertXBookmarkToTree, generateKey } from '@/utils/treeHandler';
import CustomTree, { TreeNodeWithKey } from '@/pages/Options/components/CustomTree';
import {
  setTwitterAutoAdd as setStorageAutoAdd,
  getTwitterAutoAdd as getStorageAutoAdd,
  getLocalURLs,
  setLocalURLs,
} from '@/constants';
import DoneStatus from '@/pages/Options/components/DoneStatus';
import FetchingStatus from '@/pages/Options/components/FetchingStatus';

import { Checkbox, CheckboxField } from '@/pages/Options/components/catalyst/checkbox'
import { Label } from '@/pages/Options/components/catalyst/fieldset'
import { Button } from '@/pages/Options/components/catalyst/button'
import { Input } from '@/pages/Options/components/catalyst/input'
import Header from '@/pages/Options/components/header/header';

interface Props {
}

const TWEET_TYPES = [
  "Tweet",
  "TweetWithVisibilityResults",
  "TimelineTimelineItem",
];

const SEPARATOR = " https://t.co/";
export const X_BOOKMARKS_STORE = `XBookmarkStore`;
const X_BOOKMARKS_HEADERS = `XBookmarkHeaders`;

enum Step {
  Confirm,
  Checking,
  Uploading,
  Done,
}
const { getMessage: t } = chrome.i18n;
let bookmarkHeaders: XBookmarkHeaders | null = null;

const Twitter: React.FC<Props> = ({ }: Props) => {
  const navigate = useNavigate();
  const [isLoginTwitter, setIsLoginTwitter] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const [step, setStep] = useState<Step>(Step.Confirm);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [autoAdd, setAutoAdd] = useState<boolean | null>(null);
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]);

  const [flattenData, setFlattenData] = useState<(BaseTreeNode & TweetItem)[]>([]);
  const [treeData, setTreeData] = useState<BaseTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [fetchingTree, setFetchingTree] = useState<boolean>(true);

  useEffect(() => { !isNull(autoAdd) && setStorageAutoAdd(autoAdd) }, [autoAdd])

  useEffect(() => {
    getStorageAutoAdd().then((res) => setAutoAdd(!!res))
  }, [])

  useEffect(() => {
    const handleSteps = async () => {
      switch (step) {
        case Step.Confirm:
          const intervalId = setInterval(async () => {
            bookmarkHeaders = await getLocalStorage<XBookmarkHeaders>(X_BOOKMARKS_HEADERS);

            if (bookmarkHeaders) setIsLoginTwitter(true);
          }, 2000);
          setTimer(intervalId);
          break;
        case Step.Checking:
          clearInterval(timer);
          if (isNull(bookmarkHeaders)) return
          const { url, method, headers } = bookmarkHeaders
          setFetchingTree(true);
          const localUrls = await getLocalURLs();
          const fetchTweets = async (requestUrl: string) => {
            try {
              const config: AxiosRequestConfig = {
                method,
                url: requestUrl,
                headers: headers.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {}),
              };

              const response: AxiosResponse<TwitterResult> = await axios(config);
              const result = response.data;
              const entries = result.data.bookmark_timeline_v2.timeline.instructions[0].entries;

              const filteredEntries = entries.filter(item => {
                if (TWEET_TYPES.includes(item.content.entryType)
                  && item?.content?.itemContent?.tweet_results.result) {
                  const storedIndex = flattenData.findIndex(({ id }) => id === item.entryId);
                  return storedIndex === -1;
                }
                return false;
              });

              const newTweets =
                convertXBookmarkToTree(filteredEntries.filter(item =>
                  item?.content?.itemContent?.tweet_results?.result?.tweet
                  || item?.content?.itemContent?.tweet_results?.result
                ).map((item) => {
                  const result = (
                    item?.content?.itemContent?.tweet_results?.result?.tweet
                    ||
                    item?.content?.itemContent?.tweet_results?.result
                  ) as TweetResultsResult;

                  return {
                    id: item.entryId,
                    title: result.legacy.full_text.split(SEPARATOR)[0],
                    url: `https://twitter.com/x/status/${result.rest_id}`,
                    type: "xbookmark",
                    user_create_time: new Date(result.legacy.created_at),
                    user_used_time: new Date(result.legacy.created_at),
                    node_id: "0",
                    node_index: "0",
                    parentId: "0",
                    origin_info: "",
                    author: result.core.user_results.result.legacy.name || '',
                    content: result.legacy.full_text || '',
                    status: "1",
                  };
                }))

              const checkedPart = generateKey(
                localUrls
                  .filter(({ type = '' }) => type === 'xbookmark')
                  .filter(
                    ({ url = '' }) => newTweets.find(({ url: tweetUrl }) => tweetUrl === url)
                  )
              ).map(({ key }) => key).filter(item => item) as string[];

              setDisabledKeys((prev) => [...prev, ...checkedPart]);
              setFlattenData((prevList) => [
                ...prevList,
                ...generateKey(newTweets),
              ]);

              await setLocalStorage(X_BOOKMARKS_STORE, flattenData);

              if (entries.length > 2) {
                const cursor = entries[entries.length - 1].content.value;
                const params = new URLSearchParams(requestUrl.split('?')[1]);
                params.set('variables', JSON.stringify({ ...JSON.parse(params.get('variables')!), cursor }));
                const nextUrl = `${requestUrl.split('?')[0]}?${params.toString()}`;

                await fetchTweets(nextUrl);
              } else {
                setFetchingTree(false);
              }
            } catch (error) {
              console.error(error);
              setStep(Step.Confirm);
            }
          };

          const params = new URLSearchParams(url.split('?')[1]);
          params.set('variables', JSON.stringify({ ...JSON.parse(params.get('variables')!), cursor: undefined }));
          const nextUrl = `${url.split('?')[0]}?${params.toString()}`;

          await fetchTweets(nextUrl);

          break;
        case Step.Uploading:
          const data = flattenData.filter(({ key = '', isUpdate = false }) => checkedKeys.includes(key) && !isUpdate);
          console.log("🚀 ~ handleSteps ~ data:", data)

          chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_article', body: data }, (res) => {
            console.log("🚀 ~ chrome.runtime.sendMessage ~ res:", res)
            setTimeout(() => {
              setStep(Step.Done)
            }, 1000 * 60)
          });

          setLocalURLs([
            ...await getLocalURLs(),
            ...data
          ]);

          chrome.storage.local.set({
            [X_BOOKMARKS_STORE]: flattenData.map(item => ({
              ...item,
            }))
          });
          break;
        case Step.Done:
          break;
        default:
          break;
      }
    }
    handleSteps();

    return () => {
      clearInterval(timer);
    }
  }, [step])

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

  const [importCount, setImportCount] = useState(0)
  useEffect(() => {
    setImportCount(checkedKeys
      .filter(key =>
        !disabledKeys.includes(key)
        &&
        flattenData.find(({ key: k }) => k === key)?.url
      ).length)
  }, [checkedKeys, disabledKeys, flattenData])

  return (
    <div className={clsx(
      'flex flex-col h-full',
    )}>
      {step !== Step.Done && <Header />}

      <div className=''>
        {
          step === Step.Confirm && <ConfirmStatus
            isLoginTwitter={isLoginTwitter}
            nextStep={() => setStep(Step.Checking)}
          />
        }
        {
          step === Step.Checking && <>
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
                      disabledKeys={disabledKeys}
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
                  checked={!!autoAdd}
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
      </div>
    </div >
  );
};

export default Twitter;
