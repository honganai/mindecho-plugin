import React, { useEffect, useState } from "react";
import { TweetItem } from "./type";
import { Switch, Button, Checkbox, Spin, Input } from 'antd';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { setAutoAdd as setStorageAutoAdd, setLastUpateDataTime_pocket } from '@/constants';

import clsx from "clsx";
import styles from './index.module.scss';
import { X_BOOKMARKS_STORE } from "./twitter";

interface Props {
  onLink: (page: number) => void
  isFetching: boolean
  list: TweetItem[];
}

function formatDate(date: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const month = months[date.getMonth()]; // 获取月份名称
  const day = date.getDate(); // 获取日期
  const year = date.getFullYear(); // 获取年份

  return `${month}-${day}-${year}`;
}

export default function TwitterList({ list, isFetching, onLink }: Props) {
  const IconLoadingOutlined = <LoadingOutlined style={{ fontSize: 14 }} spin />;
  const IconSearchOutlined = <SearchOutlined style={{ fontSize: 14 }} />;

  const { getMessage: t } = chrome.i18n;
  const [keywords, setKeywords] = useState('');

  const [autoAdd, setAutoAdd] = useState(true);
  const [selectList, setSelectList] = useState([] as string[])
  const [selectAll, setSelectAll] = useState(false)
  const processedList = list.filter(item => keywords
    ? (item.title.toLocaleUpperCase().includes(keywords.toLocaleUpperCase()) || item.author.toLocaleUpperCase().includes(keywords.toLocaleUpperCase()))
    : true
  )

  const [insideFetching, setInsideFetching] = useState(isFetching)

  useEffect(() => {
    setInsideFetching(isFetching)
  }, [isFetching])

  useEffect(() => {
    const checkedList = list.filter(({ checked = true }) => checked).map(({ id }) => id)
    setSelectList(checkedList)
    setSelectAll(list.length === checkedList.length)
  }, [list])

  useEffect(() => {
    setAutoAdd(true)
    setStorageAutoAdd(true);
  }, [])

  const onImport = () => {
    const data = list.filter(item => selectList.includes(item.id) && !item.isUpdate)

    chrome.storage.local.set({
      [X_BOOKMARKS_STORE]: list.map(item => ({
        ...item,
        isUpdate: true
      }))
    });

    chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_article', body: data }, (res) => {
      console.log('tweet upload_user_article',res,data);

      onLink(3)
    });
  }

  return <div className="flex h-full pb-4">
    <div className="flex flex-col h-full border border-gray-200 rounded-xl shadow-xl flex-1 w-0 py-4 ml-4">
      <h2 className="px-4 text-bold text-2xl text-center text-black" >{t('xbookmark')}
        {insideFetching ?
          <div className="text-sm text-gray-500">
            <Spin indicator={IconLoadingOutlined} />
            【{t('got')} {list.length}】{t('fetching_more')}
          </div> :
          <div className="text-sm text-gray-500">
            【{t('got')} {list.length}】{t('all_bookmarks_have_been_loaded')}
          </div>
        }</h2>

      <div className="px-4 flex justify-between items-center my-6">
        <div>
          <Input
            placeholder={t('Search items by keywords')}
            suffix={IconSearchOutlined}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <div>
          <Checkbox checked={selectAll} onChange={
            ({ target: { checked } }) => {
              setSelectAll(checked)
              setSelectList(checked ? list.map(({ id }) => id) : [])
            }
          }>
            {t('select_deselect_all_shown')}
          </Checkbox>
        </div>
      </div>

      <Checkbox.Group
        className="space-y-5 h-0 flex-1 overflow-auto"
        value={selectList} onChange={(res) => {
          setSelectList(res as string[])
          setSelectAll(!!(processedList.length === res.length))
        }}
      >
        {processedList.map(item => {
          return <div key={item.id} className="px-4 relative flex items-start">
            <div className="flex h-6 items-center">
              <Checkbox checked={item.checked} value={item.id} onChange={(e) => {
                item.checked = e.target.checked
                setSelectAll(selectList.length === processedList.length)
              }} />
            </div>
            <label htmlFor="comments" className="flex ml-3 w-0 flex-1 text-sm leading-6 font-medium text-gray-900">
              <span className="w-24 mx-2 truncate ">
                @{item.author}
              </span>
              <span className="w-24 mx-2 truncate">
                {formatDate(new Date(item.user_create_time))}
              </span>
              <p className="truncate mx-2 text-gray-500 flex-1 w-0">
                {item.content}
              </p>
            </label>
          </div>
        })}
      </Checkbox.Group>
    </div>

    <div className={clsx(
      `h-full flex flex-col items-center justify-center py-5`,
      styles['right']
    )}>
      <Button className={styles['import-btn']} size="middle" type="primary" block onClick={onImport}>
        <span>{selectList.length} {t('items')}</span><br></br>
        <span>{t('fetch')} </span>
      </Button>
      <p className={styles['auto-add']}>
        <Switch checked={autoAdd} onChange={() => {
          setAutoAdd(!autoAdd);
          setStorageAutoAdd(!autoAdd);
        }} />
        <span>{t('auto_add_new_items')}</span>
      </p>
    </div>
  </div >
}
