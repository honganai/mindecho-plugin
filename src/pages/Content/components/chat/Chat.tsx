import React, { useEffect, useState } from 'react';
import { useDebounceEffect } from 'ahooks';
import styles from './index.module.scss';
import LeftMessage from './components/left-message/LeftMessage';
import RightMessage from './components/right-message/RightMessage';
import { SendOutlined, LoadingOutlined, CopyFilled } from '@ant-design/icons';
import { Card, Input, message as Message, Skeleton } from 'antd';
import _ from 'lodash';
import { chromeDetectLanguage } from '@/utils/common.util';

const { TextArea } = Input;

interface Props {
  message: any;
  userinfo: any;
  contentRef?: any;
  conversationid?: string;
}
// chat message schema
interface MessageStruct {
  id: string;
  message: string;
  link?: string;
  role: string;
}

// response stream message schema
// {"event": "message_end", "task_id": "2d9b0d67-f41d-4d92-9657-f98f615e70ad", "id": "1bfcb3cb-a687-4c8d-8e70-0193a9bfd1ca", "conversation_id": "378c0359-ea00-4fe4-a174-9a4d0b540006"}
interface ResonseMessage {
  event: string;
  task_id: string;
  id: string;
  conversation_id: string;
  created_at?: string;
  answer?: string;
}

const History: React.FC<Props> = ({ conversationid, message, userinfo, contentRef }: Props) => {
  const [historyComplete, setHistoryComplete] = useState(false);
  const copiedI18N = chrome.i18n.getMessage('copied');
  const [messageEnd, setMessageEnd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendValue, setSendValue] = useState('');
  const [articleId, setArticleId] = useState('');
  const [list, setList] = useState<MessageStruct[]>([
    // { id: '', role: 'system', message: 'You can ask me some knowledge about your field of interest.', link: '' },
  ]);

  useEffect(() => {
    console.log('chat msg', message);
    setSendValue(message.message);
    setArticleId(message.article_id);
    // 自动发送消息
    if (message && message.message) {
      onSend(message.message);
    }
  }, [message]);

  function getChatHistory() {
    setHistoryComplete(false);
    const currentUrl = window.location.href;
    // 获取历史conversion
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'chatHistory',
        body: {
          conversation_id: conversationid,
          url: currentUrl,
        },
        headers: {},
      },
      (res) => {
        // 添加历史消息内容
        const history: any[] = [];
        _.forEach(_.get(res, 'result.data', []), (item) => {
          console.log(item.query);
          history.push({
            id: item.id,
            role: 'user',
            message: item.query,
          });
          history.push({
            id: item.id,
            role: 'system',
            message: item.answer,
            link: '',
          });
        });
        if (history.length) {
          setList((pre) => {
            return [...history, ...pre];
          });
        }
        if (_.get(res, 'result.data', []).length > 0) {
          // setConversationid(res.result.data[0].conversation_id);
        }
        setTimeout(() => {
          setHistoryComplete(true);
        }, 0);
      },
    );
  }

  useEffect(() => {
    if (conversationid && list.length === 0) {
      getChatHistory();
    }
  }, [conversationid]);

  function onBackendMessage(request: any, sender: any, sendResponse: any) {
    if (request.type === 'ws_chat_request') {
      setLoading(false);
      if (request.data.event === 'message_end') {
        setMessageEnd(true);
        return;
      }
      const msg = request.data;
      if (!msg || _.isEmpty(msg) || _.isUndefined(msg.answer)) {
        return;
      }

      setList((preData) => {
        const updatedList = preData.map((item) => {
          if (item.id === msg.id) {
            return {
              ...item,
              message: item.message + msg.answer,
            };
          }
          return item;
        });
        if (preData[preData.length - 1].id === msg.id) {
          return updatedList;
        } else {
          //进入页面后 已经获取了conveasationid 无需再次设置 否则会再次获取一次历史
          // setConversationid(msg.conversation_id || '');
          return [
            ...updatedList,
            {
              id: msg.id,
              role: 'system',
              message: msg.answer,
              link: '',
            },
          ];
        }
      });
    }
    sendResponse('ok');
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  /**
   * 发送消息
   */
  const onSend = async (msg?: any) => {
    // 一次只能发送一个问题
    if (!messageEnd) {
      Message.info(chrome.i18n.getMessage('chartWaitComplete'));
      return;
    }
    setMessageEnd(false);
    setLoading(true);
    console.log('send...', sendValue);
    setList((prevState) => [
      ...prevState,
      {
        id: 'new chat id',
        role: 'user',
        message: sendValue || msg,
      },
    ]);
    const detectedText = await chromeDetectLanguage(sendValue || msg);
    console.log('chromeDetectLanguage', detectedText);
    chrome.runtime.sendMessage(
      {
        type: 'ws_chat_request',
        data: {
          message: sendValue || msg,
          conversation_id: conversationid,
          action: 'message',
          // 不再需要传递
          // user_id: userinfo.id,
          article_id: articleId,
          url: window.location.href,
          detected_lang: detectedText,
        },
      },
      (res) => {
        console.log('ws_chat_request res: ', res);
      },
    );
    setSendValue('');
  };

  const onInputChange = (e: any) => {
    setSendValue(e.target.value);
  };
  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    // 滚动到底部
    if (historyComplete) {
      contentRef?.current.scrollTo({ top: contentRef?.current.scrollHeight });
    }
  }, [list]);

  return (
    <div className={styles['chat-container']}>
      {list && list.length !== 0 && (
        <div className="chat-list">
          {list.map((item, index) =>
            item.role === 'system' ? (
              // <LeftMessage message={item.message} key={index} link={item.link} />
              <div
                className={styles['my-message']}
                key={index}
                dangerouslySetInnerHTML={{ __html: item.message }}></div>
            ) : (
              // <RightMessage message={item.message} key={index} />
              <div className={styles['system-message']} key={index}>
                {item.message}
                {!loading && (
                  <div className={styles['copy']}>
                    <CopyFilled
                      onClick={() => {
                        const nextMessage = list.length >= index + 2 ? list[index + 1].message : '';
                        const copyText = `${item.message}\r\n${nextMessage}`;
                        navigator.clipboard.writeText(copyText).then(() => {
                          Message.success(copiedI18N);
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            ),
          )}
          {loading && (
            <div className={styles['chat-loading-skeleton']}>
              <Skeleton title={false} active />
            </div>
          )}
        </div>
      )}

      <div className="input-message">
        <TextArea
          style={{ paddingRight: '20px' }}
          rows={2}
          placeholder="Discuss more..."
          value={sendValue}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
        />
        <SendOutlined onClick={onSend} className="icon-send" />
      </div>
    </div>
  );
};

export default History;
