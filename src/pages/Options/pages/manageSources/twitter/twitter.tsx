import React, { useEffect, useState } from 'react';
import _, { isEqual } from "lodash";
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { TweetResultsResult, TweetItem, TwitterResult, XBookmarkHeaders } from './type';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getLocalStorage, setLocalStorage } from './storage';
import ConfirmStatus from './ConfirmStatus';
import { TreeNode as BaseTreeNode, convertXBookmarkToTree, generateKey } from '@/utils/treeHandler';
import CustomTree, { TreeNodeWithKey } from '@/pages/Options/components/CustomTree';

import DoneStatus from '@/pages/Options/components/DoneStatus';
import FetchingStatus from '@/pages/Options/components/FetchingStatus';

import { Checkbox, CheckboxField } from '@/pages/Options/components/catalyst/checkbox'
import { Label } from '@/pages/Options/components/catalyst/fieldset'
import { Button } from '@/pages/Options/components/catalyst/button'
import { Input } from '@/pages/Options/components/catalyst/input'

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

let localBookmarkIdData: (string | number)[] = [];
getLocalStorage(X_BOOKMARKS_STORE).then((data) => {
  localBookmarkIdData = (data as TweetItem[])
    .filter(({ isUpdate }) => isUpdate)
    .map(({ id = '' }) => id);
})

const Twitter: React.FC<Props> = ({ }: Props) => {
  const navigate = useNavigate();
  const [isLoginTwitter, setIsLoginTwitter] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const [step, setStep] = useState<Step>(Step.Confirm);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [flattenData, setFlattenData] = useState<BaseTreeNode[]>([]);
  const [treeData, setTreeData] = useState<BaseTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [fetchingTree, setFetchingTree] = useState<boolean>(true);

  useEffect(() => {
    switch (step) {
      case Step.Confirm:
        const intervalId = setInterval(async () => {
          const bookmarkHeaders = await getLocalStorage<XBookmarkHeaders>(X_BOOKMARKS_HEADERS);

          if (bookmarkHeaders) setIsLoginTwitter(true);
        }, 2000);
        setTimer(intervalId);
        break;
      case Step.Checking:
        clearInterval(timer);
        const fetchBookmarks = async () => {
          const bookmarkHeaders = await getLocalStorage<XBookmarkHeaders>(X_BOOKMARKS_HEADERS);
          if (!bookmarkHeaders) return;

          const { url, method, headers } = bookmarkHeaders;
          setFetchingTree(true);

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
                convertXBookmarkToTree(filteredEntries.map((item) => {
                  if (item
                    && item.content
                    && item.content.itemContent
                    && item.content.itemContent.tweet_results.result
                  ) {
                    const result = item.content.itemContent.tweet_results.result?.tweet
                      || item.content.itemContent.tweet_results.result;

                    try {
                      return {
                        id: item.entryId,
                        title: result.legacy.full_text.split(SEPARATOR)[0],
                        url: `https://twitter.com/x/status/${result.rest_id}`,
                        type: "xbookmark",
                        user_create_time: result.legacy.created_at || '',
                        node_id: "0",
                        node_index: "0",
                        parentId: "0",
                        user_used_time: result.legacy.created_at || "",
                        origin_info: "",
                        author: result.core.user_results.result.legacy.name || '',
                        content: result.legacy.full_text || '',
                        status: "1",
                      };
                    } catch (error) {
                      console.log(error);
                    }

                    return null
                  }
                  return null;
                }) as TweetItem[])

              setCheckedKeys((prev) => {
                return [...prev, ...newTweets.map(({ key = '' }) => key)]
              });

              setFlattenData((prevList) => [
                ...prevList,
                ...newTweets.map((item) => ({
                  ...item,
                  isUpdate: localBookmarkIdData.includes(item.id),
                })),
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
        };

        fetchBookmarks();
        break;
      case Step.Uploading:
        const data = flattenData.filter(({ key = '', isUpdate = false }) => checkedKeys.includes(key) && !isUpdate)

        chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_article', body: data }, (res) => {
          console.log("🚀 ~ chrome.runtime.sendMessage ~ res:", res)
          setStep(Step.Done);
        });

        chrome.storage.local.set({
          [X_BOOKMARKS_STORE]: flattenData.map(item => ({
            ...item,
            isUpdate: true
          }))
        });
        break;
      case Step.Done:
        break;
      default:
        break;
    }

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

  return (
    <div className={clsx(
      'flex flex-col h-full',
    )}>
      <div className="font-bold text-lg text-black">X {t('bookmarks')}</div>
      <div className="mt-2">{t('search_in_your_thousands_of_x_bookmarks')}</div>

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
                      checkedKeys={checkedKeys}
                      onCheck={(newCheckedKeys) => !isEqual(newCheckedKeys, checkedKeys) && setCheckedKeys(newCheckedKeys)}
                      treeData={(treeData[0].children || []) as TreeNodeWithKey[]}
                    />
                    : <div className="text-center">{t('no_data_available')}</div>
              }
            </div>

            <div className="flex items-center justify-end mt-4">
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
      </div>
    </div >
  );
};

export default Twitter;
