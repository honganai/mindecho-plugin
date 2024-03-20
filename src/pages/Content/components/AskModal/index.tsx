import React, { useContext, useEffect } from 'react';
import { Modal, Input } from 'antd';
import { getDocument } from '@/utils/common.util';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';

import EnterImage from '@/assets/img/enter.svg';
import styles from './index.module.scss';

const AskModal: React.FC = () => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { showAskModal, showAnswerModal } = globalState;
  useEffect(() => {
    if (showAskModal) {
      setTimeout(() => {
        getDocument().getElementById('mindecho-ask-input')?.focus();
      }, 500);
    }
  }, [showAskModal]);

  return (
    <Modal
      centered={true}
      className={styles.modal}
      open={showAskModal && !showAnswerModal}
      onCancel={() => {
        globalDispatch({
          type: GlobalActionType.SetShowAskModal,
          payload: false,
        });
      }}
      destroyOnClose={true}
      forceRender={true}
      footer={null}
      maskStyle={
        {
          // backgroundColor: 'rgba(255, 255, 255, 0.6)',
        }
      }
      getContainer={() => getDocument().getElementById('mindecho-sidebar-flat') || document.body}>
      <div className={styles.container}>
        <Input.TextArea
          id="mindecho-ask-input"
          autoSize={false}
          rows={4}
          placeholder="Ask Your Saves"
          onPressEnter={(e) => {
            e.preventDefault(); // 阻止回车换行，直接提交
            console.log(e.currentTarget.value);
            const value = e.currentTarget.value;
            if (value?.trim()) {
              chrome.runtime.sendMessage(
                {
                  type: 'ws_chat_request',
                  data: {
                    message: value?.trim(),
                    action: 'message',
                  },
                },
                (res) => {
                  console.log('ws_chat_request res: ', res);
                },
              );
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
              globalDispatch({
                type: GlobalActionType.SetQuestion,
                payload: value?.trim(),
              });
              globalDispatch({
                type: GlobalActionType.SetShowAskModal,
                payload: false,
              });
              globalDispatch({
                type: GlobalActionType.SetShowAnswerModal,
                payload: true,
              });
            }
          }}
        />
        <div className={styles.enter}>
          <EnterImage />
        </div>
      </div>
    </Modal>
  );
};

export default AskModal;
