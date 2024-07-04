import React, { useEffect, useContext, useState } from 'react';
import _, { isEqual, isNull } from "lodash";
import { setAutoAdd as setStorageAutoAdd, getAutoAdd as getStorageAutoAdd } from '@/constants';
import { MAX_SIZE } from '@/utils/common.util';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Checkbox, CheckboxField } from '@/pages/Options/components/catalyst/checkbox'
import { Label } from '@/pages/Options/components/catalyst/fieldset'
import { Button } from '@/pages/Options/components/catalyst/button'

import { Input } from '@/pages/Options/components/catalyst/input'
import { convertPocketToTree } from '@/utils/treeHandler';
import CustomTree, { TreeNodeWithKey } from '@/pages/Options/components/CustomTree';
import { TreeNode as BaseTreeNode } from '@/utils/treeHandler';
import Header from '@/pages/Options/components/header/header';

const { getMessage: t } = chrome.i18n;

const fetchDataFormChrome: () => Promise<IPocketURL[]> = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: { page: 1, page_size: MAX_SIZE, title: '', type: 'pocket' } }, (res) => {
      resolve(res?.result || [])
    });
  })
}


const Bind = () => {
  const types = 'pocket'
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_status', body: {} }, (res) => {
      if (res?.data?.pocket) {
        resolve(res)
      } else {
        chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_url', body: { bind_source: types, extensionId: chrome.runtime.id } }, (res) => {
          console.log('bindPocket res:', res);
          if (res.data.url !== '') {
            window.open(res.data.url, '_blank');
            // 定义计时器变量
            let timer = 0;
            const interval = 5000;
            const maxTime = 10 * 60 * 1000;

            // 定义定时器函数
            const mainTimer = setInterval(() => {
              timer += interval;
              if (timer >= maxTime) {
                clearInterval(mainTimer); // 超过3分钟后清除主定时器
              } else {
                chrome.runtime.sendMessage({ type: 'request', api: 'get_bind_status', body: { code: res.data.code } }, (res) => {
                  if (res.data[types]) {
                    resolve(res)
                    clearInterval(mainTimer); // 成功后清除主定时器
                  }
                });
              }
            }, interval);
          }
        });
      }
    })
  })
}

enum Step {
  Authorisation,
  Checking,
}

export interface IPocketURL {
  id: number;
  user_id: number;
  title: string;
  url: string;
  type: string;
  status: number;
  user_create_time: Date;
  node_id: null;
  node_index: null;
  parentId: null;
  user_used_time: Date;
  properties: null;
  origin_info: null;
  url_hash_id: string;
  error_message: null;
  created_on: Date;
  changed_on: Date;
  article_content: string;
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
  const [step, setStep] = useState<Step>(Step.Authorisation);

  useEffect(() => {
    getStorageAutoAdd().then((res) => setAutoAdd(!!res))
  }, [])

  useEffect(() => { !isNull(autoAdd) && setStorageAutoAdd(autoAdd) }, [autoAdd])

  useEffect(() => setTreeData(searchKeyword.trim() === ''
    ? flattenData
    : flattenData
      .filter(
        item =>
          (item.title && item.title.includes(searchKeyword))
          || item.url && item.url.includes(searchKeyword)
      )
  ), [flattenData, searchKeyword])

  useEffect(() => {
    switch (step) {
      case Step.Authorisation:
        Bind().then((res) => {
          setStep(Step.Checking)
        })
        break;
      case Step.Checking:
        fetchDataFormChrome()
          .then((res) => {
            const pocketTree = convertPocketToTree(res)
            const keyOfPocketTree = pocketTree.map(({ key }) => key)

            setFlattenData(pocketTree)
            setCheckedKeys(keyOfPocketTree)
            setDisabledKeys(keyOfPocketTree)
          }).finally(() => setFetchingTree(false));
        break;
      default:
        break;
    }
  }, [step])

  return (<div className={clsx(
    'flex flex-col h-full',
  )}>
    <Header />

    {step === Step.Authorisation && <div className="shrink mt-4 min-w-[300px] items-start justify-center border-y border-zinc-200 bg-white sm:max-w-full sm:rounded-lg sm:border dark:border-white/10 dark:bg-zinc-900 p-4 max-h-[75vh] overflow-auto">
      <div className="text-center">
        Please authorise the extension to access your Pocket data
      </div>
    </div>
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

        <div className="flex items-center justify-end mt-4">
          <div className='flex'>
            <Button outline onClick={() => navigate('/manage-sources')}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      </>
    }
  </div>)
};

export default BrowserData;
