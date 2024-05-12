import React, { useState, useContext, Component } from "react";
import clsx from 'clsx';
import { motion, AnimatePresence } from "framer-motion";
import { FullScreenLoading } from "../FullScreenLoading";
import { Pagination, Tooltip } from "antd";
import { CheckCircleOutlined, EllipsisOutlined, ExclamationOutlined } from '@ant-design/icons';
const { getMessage: t } = chrome.i18n;
import GlobalContext, { ActionType as GlobalActionType } from "@/reducer/global";

import { CollectionsHeaderTabSwitcher } from '@/pages/Options/components/user/collections/headerTabSwitcher';
export function Collections() {
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [collections, setCollections] = React.useState<any[]>([]);
  // 分页数据
  const [page, setPage] = React.useState<number>(1);
  const [totalPage, setTotalPage] = React.useState<number>(0);
  const pageSize = 10;

  const [currentContentType, setCurrentContentType] = useState(0);

  const getProgress = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      globalDispatch({
        type: GlobalActionType.SetProgress,
        payload: res || null,
      })
    });
  }
  const getUserUrl = (data: {
    status: number,
    page: number,
    page_size: number
  }) => {
    setLoading(true)
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_url', body: data }, (res) => {
      setCollections(res?.result || [])
      setTotalPage(res?.total_count || 0)
      setLoading(false)
    });
  }
  React.useEffect(() => {
    getUserUrl({ status: currentContentType, page, page_size: pageSize })
    getProgress()
  }, [page, pageSize, currentContentType]);

  React.useEffect(() => {
    setPage(1)
  }, [currentContentType]);

  const fetchingIcon = {
    Component: <EllipsisOutlined className="rounded-full border border-solid border-sky-500 text-sky-500" />,
    popText: `Fetching & Processing`,
  }

  const iconMap: { [key: number]: any } = {
    1: fetchingIcon,
    2: fetchingIcon,
    5: fetchingIcon,
    3: {
      Component: <CheckCircleOutlined className="rounded-full bg-green-500 text-white" />,
      popText: `Full content  & available for query`,
    },
    4: {
      Component: <ExclamationOutlined className="rounded-full border border-solid border-red-500	 text-red-500" />,
      popText: `Content not available.`,
    },
  }

  return <div className={clsx(`h-full relative flex flex-col px-4`)}>


    <CollectionsHeaderTabSwitcher
      currentContentType={currentContentType}
      onTypeChange={setCurrentContentType}
    />

    <div className="flex-1 h-0 overflow-auto  flex flex-col ">
      {loading && <FullScreenLoading />}

      {collections.map(item => (
        <motion.div
          key={item.id}
          className='flex p-4 hover:bg-gray-100 hover text-gray-600 w-full border-solid border-gray-100 border-b last:border-b-0 last:pb-0'
        >

          <div className="mr-2">
            <Tooltip placement="top" title={iconMap[item.status].popText}>{
              iconMap[item.status].Component
            }</Tooltip></div>

          <div className="w-0 flex-1">
            <div className="flex between">
              <div className={
                clsx('font-bold flex-1 w-0 text-inherit hover:text-slate-900 cursor-pointer')
              }>
                {item.title}
              </div>
              <div className="pl-10">{(new Date(item.user_create_time)).toString()}</div>
            </div>

            <div className="text-sm text-gray-500">{item.url}</div>

            <div className={
              clsx('line-clamp-3')
            }>{
                item.article_content || item.title
              } </div>

          </div>
        </motion.div>)
      )}
    </div>

    {totalPage > 0 && <div
      className="mt-4 mb-4 w-full text-center "
    >
      <Pagination
        current={page}
        showSizeChanger={false}
        total={totalPage}
        onChange={(page) => setPage(page)}
      />
    </div>
    }
  </div>;
}