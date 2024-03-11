import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import _ from 'lodash';
import { notification } from 'antd';
import reqShowSummary from '@/utils/showSummary';
import GlobalContext, { ActionType } from '@/reducer/global';
import { SyncOutlined } from '@ant-design/icons';

const order = ['intent', 'note', 'content_type', 'key_logics', 'data_sheet', 'quotes', 'further_questions'];

/**
 * 将流式返回的字符串转化为json数据
 * 实现逻辑是：将最后一个}后的内容去掉，再加上]转JSON
 * 如果转失败则返回null
 * 不用正则截取{}是因为可能返回的文本里本身就有{}符号 */
const formatJsonString = (str: string) => {
  let parseJson = null;
  const lastIndex = str.lastIndexOf('}');
  if (lastIndex > -1) {
    try {
      parseJson = JSON.parse(`${str.slice(0, lastIndex + 1)}]`);
    } catch (error) {
      //
    }
  }
  return parseJson;
};

const useDistillBlock = () => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const [reciveEnd, setReciveEnd] = useState(false);
  const streamResponse = useRef(''); // 流式返回的字符串
  const [parseStream, setParseStream] = useState<Record<string, string>[]>([]); // 流式返回的字符串转为json数据
  const [markdownStream, setMarkdownStream] = useState('');

  const restData = () => {
    streamResponse.current = '';
    setReciveEnd(false);
    // setParseStream([]);
    setMarkdownStream('');
  };

  // 排序之后的数据
  const sortedList = useMemo(() => {
    return parseStream ? parseStream.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)) : [];
  }, [parseStream]);

  // 筛选出捕获内容和提问数据
  const { furtherQuestions, captureContent, intentNote } = useMemo(() => {
    const furtherQuestions = sortedList?.filter((data) => Object.keys(data)[0] == 'further_questions')?.[0];
    const captureContent = sortedList?.filter((data) =>
      ['content_type', 'key_logics', 'data_sheet', 'quotes'].includes(Object.keys(data)[0]),
    );
    const intentNote = {
      ...sortedList?.filter((data) => Object.keys(data)[0] == 'intent')?.[0],
      ...sortedList?.filter((data) => Object.keys(data)[0] == 'note')?.[0],
    };

    return {
      furtherQuestions,
      captureContent,
      intentNote,
    };
  }, [sortedList]);

  const onBackendMessage = useCallback((request: any, sender: any, sendResponse: any) => {
    console.log('distill block', request);
    // 发起请求获取distill和goal数据
    if (request.type === 'showSummary' && request.data && !_.isEmpty(request.data)) {
      const message = {
        data: request.data,
        sender: { ...request.sender, ua: navigator.userAgent },
      };
      chrome.runtime.sendMessage(
        {
          type: 'ws_distill_pointread_request',
          data: {
            ...message,
          },
        },
        (res) => {
          console.log('ws_distill_pointread_request send :', res);
        },
      );
    } else if (request.type === 'ws_distill_pointread_request' && request.data && !_.isEmpty(request.data)) {
      if (request.data.event === 'message') {
        setReciveEnd(false);
        // 给双引号加上反斜杠
        streamResponse.current = streamResponse.current + request.data.answer;
        // .replace(/(?<=:)\s/, '')
        // .replace(/(?<=[^{}:\\])"(?=[^{}:])/g, '');
        console.log(
          '🚀 ~ file: useDistillBlock.tsx:87 ~ onBackendMessage ~ streamResponse.current:',
          streamResponse.current,
        );
        setMarkdownStream(streamResponse.current);
        // try {
        //   const newJson = formatJsonString(streamResponse.current);
        //   if (newJson) {
        //     console.log('🚀 ~ file: useDistillBlock.tsx:92 ~ onBackendMessage ~ setParseStream:', newJson);
        //     setParseStream(newJson);
        //   }
        // } catch {
        //   //
        // }
      } else if (request.data.event === 'message_end') {
        // setReciveEnd(true);
      } else if (request.data.event === 'message_format') {
        setReciveEnd(true);
        const error = request.data.error_code;
        if (error) {
          if (error === 'FREE_SUBSCRIPTION_QUOTA_REACHED') {
            // 超过套餐次数弹出充值
            globalDispatch({
              type: ActionType.SetShowSubscribeModal,
              payload: true,
            });
          } else {
            // 报错弹出提示，可以点击重试
            notification.info({
              message: chrome.i18n.getMessage('errorDistill'),
              duration: null,
              description: (
                <div>
                  {chrome.i18n.getMessage('errorDistillDesc')}
                  <a
                    style={{ marginLeft: 6 }}
                    onClick={() => {
                      restData();
                      reqShowSummary(globalState.cleanArticle.content);
                      notification.destroy();
                    }}>
                    {chrome.i18n.getMessage('tryAgain')}
                    <SyncOutlined />
                  </a>
                </div>
              ),
            });
          }
        } else {
          setMarkdownStream(request.data.data);
          // setParseStream(request.data.data || []);
          globalDispatch({
            type: ActionType.SetArticleId,
            payload: request.data.article_id,
          });
          globalDispatch({
            type: ActionType.SetConversationId,
            payload: request.data.conversation_id,
          });
          globalDispatch({
            type: ActionType.SetArticleDistillId,
            payload: request.data.article_distill_id,
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  return {
    reciveEnd,
    furtherQuestions,
    captureContent,
    intentNote,
    restData,
    markdownStream,
  };
};

export default useDistillBlock;
