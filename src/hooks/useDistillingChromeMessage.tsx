import React, { useContext, useEffect, useMemo, useState } from 'react';
import type { DistillItem } from '../types';

import _ from 'lodash';
import { notification } from 'antd';
import reqShowSummary from '@/utils/showSummary';
import GlobalContext from '@/reducer/global';

const order = [
  '<Summary>',
  '<Content Type>',
  '<Plots>',
  '<Key Logics>',
  '<Conclusions>',
  '<Perspectives & Conclusions>',
  '<Data Sheet>',
  '<Quotes>',
  '<Further Questions>',
  '<Unasked Questions>',
];

const useDistillingChromeMessage = () => {
  const [fetchType, setFetchType] = useState('stream'); // sync / stream
  const [conversationid, setConversationid] = useState('');
  const [articleId, setArticleId] = useState(0);
  const [articleDistillId, setarticleDistillId] = useState(0);
  const [list, setList] = useState<DistillItem[]>([]);
  const [reciveEnd, setReciveEnd] = useState(false);
  const [streamResponse, setStreamResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [highlight, setHighlight] = useState<{
    [key: string]: any;
  }>({});
  const [forceRender, setForceRender] = useState(false);
  const { state: globalState } = useContext(GlobalContext);
  // const [loadingGoalSummary, setLoadingGoalSummary] = useState(true);
  // const [goal, setGoal] = useState<Goal[]>([]);
  // const currentGoal = useRef(''); // 选中goal

  // 监听 chrome 消息
  const onBackendMessage = (request: any, sender: any, sendResponse: any) => {
    console.log('distill', request);
    if (request.type === 'showSummary' && request.data && !_.isEmpty(request.data)) {
      const message = {
        data: request.data,
        sender: { ...request.sender, ua: navigator.userAgent },
      };
      console.log('onBackendMessage message', message);
      if (fetchType === 'sync') {
        chrome.runtime.sendMessage(
          {
            type: 'request',
            api: 'distillBlocking',
            body: message,
            headers: {},
          },
          (res) => {
            try {
              if (!res.result || !res.result.answer) {
                return;
              }
              console.log('onBackendMessage res.result', res.result);
              setConversationid(res.result.conversation_id);
              setArticleId(res.result.article_id);
              setarticleDistillId(res.result.article_distill_id);
              _.forEach(res.result.answer, (val, key) => {
                if (val == 'N/A') {
                  return;
                }
                const item = {
                  key,
                  list: _.compact(_.isArray(val) ? val : [val]),
                  highlight: {},
                };
                if (item.list.length < 1) return;
                setList((pre) => {
                  return [...pre, item];
                });
              });
            } catch (err) {
              console.log('onBackendMessage err', err);
            }
          },
        );
      } else {
        // console.log('userInfo', userInfo);
        // 使用websocket发送summary请求
        setTimeout(() => {
          chrome.runtime.sendMessage(
            {
              type: 'ws_distill_request',
              data: {
                ...message,
                // 不再需要传递
                // user_id: userinfo?.id || _.get(request, 'data.userinfo.id', 0),
              },
            },
            (res) => {
              console.log('ws_distill_request send :', res);
            },
          );
        }, 700);
      }
    }
    if (request.type === 'showGoal' && request.data && !_.isEmpty(request.data)) {
      const message = {
        data: request.data,
        sender: { ...request.sender, ua: navigator.userAgent },
      };
      console.log('goal message', message);
      // 使用websocket发送summary请求
      // setTimeout(() => {
      //   chrome.runtime.sendMessage(
      //     {
      //       type: 'ws_distill_by_goal_request',
      //       data: {
      //         ...message,
      //       },
      //     },
      //     (res) => {
      //       console.log('ws_distill_by_goal_request send :', res);
      //     },
      //   );
      // }, 700);
    }
    if (fetchType === 'stream') {
      // listen socket response
      if (request.type === 'ws_distill_request' && request.data && !_.isEmpty(request.data)) {
        if (request.data.event === 'message') {
          setReciveEnd(false);
          setStreamResponse((pre) => {
            return pre + request.data.answer;
          });
        } else if (request.data.event === 'message_end') {
          setReciveEnd(true);
          setLoading(false);
        } else if (request.data.event === 'message_format') {
          const error = request.data.error_code;
          if (error) {
            notification.error({
              message: chrome.i18n.getMessage(`error${request.data.status}`) || chrome.i18n.getMessage(`errorDefault`),
              duration: null,
              description: (
                <div>
                  {request.data.error_message}
                  <a
                    onClick={() => {
                      setLoading(true);
                      reqShowSummary(globalState.cleanArticle.content);
                      notification.destroy();
                    }}>
                    {chrome.i18n.getMessage('retry')}
                  </a>
                </div>
              ),
            });
          }
          // 收到完整消息
          console.log('收到完整消息');
          setLoading(false);
          setConversationid(request.data.conversation_id);
          setarticleDistillId(request.data.article_distill_id);
          setArticleId(request.data.article_id);
          setTimeout(() => {
            const data: DistillItem[] = [];
            _.forEach(request.data.data || [], (item, key) => {
              const list = _.isString(item) ? [item] : item;
              data.push({
                key,
                list,
                highlight: {},
              });
            });
            setList(data);
          }, 500);
        } else if (request.data.event === 'message_highlight') {
          setHighlight((pre) => {
            return {
              ...pre,
              [request.data.query]: request.data.highlight,
            };
          });
          setForceRender(!forceRender);
          // console.log('message_highlight');
          // console.log(request.data);
        }
      }
      // goal数据
      // if (request.type === 'ws_distill_by_goal_request' && request.data && !_.isEmpty(request.data)) {
      //   console.log('goal request', request);
      //   if (request.data.event === 'message') {
      //     // 获取到goal摘要
      //     setLoadingGoalSummary(false);
      //     setGoal((pre) => {
      //       return pre.map((el) => {
      //         if (String(el.goal_id) == currentGoal.current) {
      //           el.summary = (el.summary || '') + request.data.answer;
      //         }
      //         return el;
      //       });
      //     });
      //   } else if (request.data.event === 'message_end') {
      //     // do nothing
      //   }
      // }
    }

    sendResponse('ok');
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  useEffect(() => {
    if (articleId && fetchType === 'sync') {
      chrome.runtime.sendMessage(
        {
          type: 'request',
          api: 'distillHighlight',
          body: {
            article_id: articleId,
          },
          headers: {},
        },
        (res) => {
          console.log(res.result);
          if (!res.result || _.isEmpty(res.result)) {
            return;
          }
          _.forEach(res.result || [], (item, key) => {
            const index = _.findIndex(list, (item) => item.key === key);
            console.log('index', index);
            if (index > -1) {
              setList((pre) => {
                pre[index] = { ...pre[index], highlight: res.result[key] };
                console.log(pre);
                return pre;
              });
            }
          });
          setForceRender(true);
        },
      );
    }
  }, [articleId]);

  // 排序之后的数据
  const sortedList = useMemo(() => {
    return list ? list.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)) : [];
  }, [list]);

  // 筛选出捕获内容和提问数据
  const { furtherQuestions, captureContent } = useMemo(() => {
    const furtherQuestions = sortedList?.filter((data) => data.key === '<Further Questions>')?.[0];
    const captureContent = sortedList?.filter((data) => data.key !== '<Further Questions>');
    return {
      furtherQuestions,
      captureContent,
    };
  }, [sortedList]);

  return {
    fetchType,
    setFetchType,
    conversationid,
    setConversationid,
    articleId,
    setArticleId,
    articleDistillId,
    setarticleDistillId,
    sortedList,
    reciveEnd,
    setReciveEnd,
    streamResponse,
    setStreamResponse,
    loading,
    setLoading,
    highlight,
    setHighlight,
    forceRender,
    setForceRender,
    // loadingGoalSummary,
    // setLoadingGoalSummary,
    // goal,
    // setGoal,
    // currentGoal,
    furtherQuestions,
    captureContent,
  };
};

export default useDistillingChromeMessage;
