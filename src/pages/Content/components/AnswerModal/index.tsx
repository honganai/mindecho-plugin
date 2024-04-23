import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal, Input, Button, Skeleton, Result } from 'antd';
import { getDocument, truncateTitle } from '@/utils/common.util';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import _ from 'lodash';
import MarkdownContent from './MarkdownContent';
import styles from './index.module.scss';
import MyProgress from '../Myprogress';
import cs from 'classnames';

interface IReferences {
  title: string;
  content: string;
  url: string;
  source_type: string;
  document_id: string;
}

const AnswerModal: React.FC = () => {
  const { getMessage: t } = chrome.i18n;
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { progress, showAskModal, showAnswerModal, isRequesting, requestEnd, markdownStream } = globalState;
  const markdownStreamRef = useRef('');
  const [question, setQuestion] = useState('');
  const [References, setReferences] = useState<IReferences[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  // 重置返回结果
  useEffect(() => {
    if (!markdownStream) {
      markdownStreamRef.current = '';
    }
  }, [markdownStream]);

  function onBackendMessage(request: any, sender: any, sendResponse: any) {
    if (request.type === 'ws_chat_request') {
      globalDispatch({
        type: GlobalActionType.SetIsRequesting,
        payload: false,
      });
      if (request.data.event === 'message_end') {
        globalDispatch({
          type: GlobalActionType.SetRequestEnd,
          payload: true,
        });
        return;
      }
      markdownStreamRef.current += request.data.answer;
      // setMarkdownStream(markdownStreamRef.current);
      globalDispatch({
        type: GlobalActionType.SetMarkdownStream,
        payload: markdownStreamRef.current,
      });
      sendResponse('ws_chat_request ok');
    }
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  useEffect(() => {
    if (showAnswerModal) {
      getProgress();
      const intervalId = setInterval(() => {
        getProgress();
      }, 5000);
      setTimer(intervalId);
    } else {
      clearInterval(timer);
    }
  }, [showAnswerModal]);

  const getProgress = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      globalDispatch({
        type: GlobalActionType.SetProgress,
        payload: res || null,
      })
    });
  }

  useEffect(() => {
    let done = true;
    if (_.isArray(progress)) {
      progress?.forEach((item: any) => {
        if (item.type !== 'history' && item.status > 0 && item.status < 3 && item.count > 0) {
          done = false;
        }
      });
      if (done) {
        clearInterval(timer);
      }
    }
  }, [progress, timer]);

  useEffect(() => {
    if (globalState.question && isRequesting) {
      setQuestion(globalState.question);
      startSearch();
    }
  }, [globalState.question, isRequesting])

  const startSearch = () => {
    if (globalState.question) {
      chrome.runtime.sendMessage({ type: 'request', api: 'get_dataset_document', body: { query: globalState.question } }, (res) => {
        setReferences(res || []);

        chrome.runtime.sendMessage(
          {
            type: 'ws_chat_request',
            data: {
              message: globalState.question,
              action: 'message',
              article_content: getWsContent(res),
            },
          },
          (res) => {
            console.log('ws_chat_request res: ', res);
          },
        );
      });
    }
  }

  const getWsContent = (data: any) => {
    let result: string = '';
    data.forEach((item: any, index: number) => {
      if (index > 0) result += `
      -----------------------
      `
      result +=
        `[${index + 1}]Title:${item.title}
      Content: ${item.content}
      URL:${item.url}`;
    });
    return result;
  }

  const sendQuestion = useCallback(() => {
    if (question?.trim()) {
      globalDispatch({
        type: GlobalActionType.SetQuestion,
        payload: question?.trim(),
      });
      globalDispatch({
        type: GlobalActionType.SetShowAskModal,
        payload: false,
      });
      globalDispatch({
        type: GlobalActionType.SetMarkdownStream,
        payload: '',
      });
      globalDispatch({
        type: GlobalActionType.SetIsRequesting,
        payload: true,
      });
      globalDispatch({
        type: GlobalActionType.SetRequestEnd,
        payload: false,
      });
    }
  }, [question]);

  const closeModal = () => {
    globalDispatch({
      type: GlobalActionType.SetShowAnswerModal,
      payload: false,
    });
    globalDispatch({
      type: GlobalActionType.SetShowAskModal,
      payload: false,
    });
  };

  const getHost = (url: string) => {
    return new URL(url).host;
  }

  const getBlockquote = (source_type: string) => {
    switch (source_type) {
      case 'bookmark':
        return 'Bookmarks';
      case 'history':
        return 'History';
      case 'readinglist':
        return 'Reading List';
      default:
        return source_type;
    }
  }

  return (
    <Modal
      className={styles.modal}
      open={showAnswerModal}
      maskClosable={false}
      onCancel={() => {
        closeModal();
      }}
      footer={null}
      width={'90%'}
      maskStyle={
        {
          // backgroundColor: 'rgba(255, 255, 255, 0.6)',
        }
      }
      getContainer={() => getDocument().getElementById('mindecho-sidebar-flat') || document.body}>
      <h1 className={styles.title}>{globalState.question}</h1>
      {isRequesting && !requestEnd ? (
        <div className={styles.card}>
          <Skeleton title={false} active />
        </div>
      ) : (
        <>
          <div className={styles.content}>
            <div className={styles.header}>
              <h3>{t('sources')}: {References.length}</h3>
              <MyProgress />
            </div>
            {References.length > 0 ? (
              <>
                <ul>
                  {References.map((item, index) => {
                    return (
                      <li key={item.document_id} className={styles['source-item']}>
                        <span className={styles.number}>{index + 1}</span>
                        <a className={styles.title} href={item.url} target="_blank" rel="noreferrer">
                          {item.title}
                        </a>
                        <p className={styles.urlBox}>
                          <span className={styles.host}>{getHost(item.url)}</span>
                          <a className={styles.url} href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                        </p>
                        <p className={styles.contentText}>{truncateTitle(item.content, 30, 60)}</p>
                        <span className={styles.blockquote}>{getBlockquote(item.source_type)}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className={styles['no-found']}>
                <p className={styles.title}>{t('no_data_available')}</p>
                <p className={styles['sub-title']}>{t('the_sources_may_not_be_fully_ready_yet_or_please_try_asking_differently')}</p>
                <p className={styles['sub-title']}>{t('or_you_can')}</p>
                <div className={styles['no-found-btns']}>
                  <Button className={styles.btn} disabled>{t('query_the_web')}</Button>
                  <Button className={styles.btn} disabled>{t('ask_AI')}</Button>
                </div>
              </div>
            )}
          </div>
          <MarkdownContent markdownStream={markdownStream} refresh={sendQuestion}></MarkdownContent>
          {requestEnd && (
            <div className={styles.btns}>
              <div className={styles['new-query']}>
                {showAskModal && (
                  <div className={styles.ask}>
                    <Input.TextArea
                      autoSize={false}
                      rows={1}
                      autoFocus={showAnswerModal}
                      placeholder={t('ask_your_saves')}
                      onChange={(e) => {
                        setQuestion(e.currentTarget.value);
                      }}
                      onPressEnter={(e) => {
                        e.preventDefault(); // 阻止回车换行，直接提交
                        sendQuestion();
                      }}
                    />
                    {/* <div className={styles.enter}>
                      <EnterImage />
                    </div> */}
                  </div>
                )}
                <Button
                  className={cs(styles['btn'], styles['btn-ask'])}
                  onClick={() => {
                    if (showAskModal) {
                      // 发起请求
                      sendQuestion();
                    } else {
                      // 显示问题输入
                      globalDispatch({
                        type: GlobalActionType.SetShowAskModal,
                        payload: true,
                      });
                    }
                  }}>
                  {t('new_query')}
                </Button>
              </div>
              <Button
                className={cs(styles['btn'], styles['btn-close'])}
                onClick={() => {
                  closeModal();
                }}>
                Close
              </Button>
            </div>
          )}
        </>
      )
      }
    </Modal >
  );
};

export default AnswerModal;
