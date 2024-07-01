import React, { useEffect, useState } from "react";
import { TweetItem } from "./type";
import { Switch, Button, Checkbox, Spin, Input } from 'antd';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { setAutoAdd as setStorageAutoAdd, setLastUpdateDataTime_pocket } from '@/constants';
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import styles from './index.module.scss';
import { X_BOOKMARKS_STORE } from "./twitter";

interface Props {
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

const { getMessage: t } = chrome.i18n;

export default function TwitterList({ list }: Props) {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [autoAdd, setAutoAdd] = useState(true);
  const [selectList, setSelectList] = useState([] as string[])
  const [selectAll, setSelectAll] = useState(false)
  const processedList = list.filter(item => keywords
    ? (item.title.toLocaleUpperCase().includes(keywords.toLocaleUpperCase()) || item.author.toLocaleUpperCase().includes(keywords.toLocaleUpperCase()))
    : true
  )

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
      console.log('tweet upload_user_article', res, data);

      navigate('building')
    });
  }

  return
}
