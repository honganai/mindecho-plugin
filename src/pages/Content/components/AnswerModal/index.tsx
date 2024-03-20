import React, { useContext, useEffect, useRef, useState } from 'react';
import { Modal, Input, Button, Skeleton } from 'antd';
import { getDocument } from '@/utils/common.util';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';

import MarkdownContent from './MarkdownContent';
import styles from './index.module.scss';

const AnswerModal: React.FC = () => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { showAskModal, showAnswerModal, isRequesting, requestEnd, markdownStream } = globalState;
  // const [markdownStream, setMarkdownStream] = useState('');
  const markdownStreamRef = useRef('');
  const [question, setQuestion] = useState('');

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
    }
    sendResponse('ok');
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  const sendQuestion = () => {
    if (question?.trim()) {
      globalState.question = question?.trim();
      chrome.runtime.sendMessage(
        {
          type: 'ws_chat_request',
          data: {
            message: question?.trim(),
            action: 'message',
          },
        },
        (res) => {
          console.log('ws_chat_request res: ', res);
        },
      );


      globalDispatch({
        type: GlobalActionType.SetShowAskModal,
        payload: false,
      });
      globalDispatch({
        type: GlobalActionType.SetShowAnswerModal,
        payload: true,
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
  };

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
          <MarkdownContent markdownStream={markdownStream}></MarkdownContent>
          {requestEnd && (
            <div className={styles.btns}>
              <div className={styles['new-query']}>
                {showAskModal && (
                  <div className={styles.ask}>
                    <Input.TextArea
                      autoSize={false}
                      rows={1}
                      autoFocus={showAnswerModal}
                      placeholder="Ask Your Saves"
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
                  type="primary"
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
                  New Query
                </Button>
              </div>
              <Button
                onClick={() => {
                  closeModal();
                }}>
                Close
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default AnswerModal;
