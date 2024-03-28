import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Modal, Input, Spin, Switch } from 'antd';
import { MoreOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { getDocument, SetInterval, truncateTitle, } from '@/utils/common.util';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import _, { set } from 'lodash';
import EnterImage from '@/assets/img/enter.svg';
import styles from './index.module.scss';
import { render } from 'react-dom';
import MyProgress from '../Myprogress';

interface IExample {
  title: string;
  url: string;
}

const AskModal: React.FC = () => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { showAskModal, showAnswerModal, progress } = globalState;
  const [example, setExample] = useState<IExample>({ title: '', url: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_recent' }, (res) => {
      console.log('get_user_recent res: ', res);
      const { title, url } = res;
      setExample({
        title,
        url,
      })
    });
    getProgress();
    chrome.storage.local.get(['mindecho-auto-add']).then((result: any) => {
      setAutoAdd(result['mindecho-auto-add'])
    });
  }, []);

  useEffect(() => {
    if (showAskModal) {
      setTimeout(() => {
        getDocument().getElementById('mindecho-ask-input')?.focus();
      }, 500);
      const intervalId = setInterval(() => {
        getProgress();
      }, 5000);

      setTimer(intervalId);
    } else {
      clearInterval(timer);
    }
  }, [showAskModal]);

  const getProgress = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      globalDispatch({
        type: GlobalActionType.SetProgress,
        payload: {
          data: res || null,
          getIng: false,
        },
      })
    });
  }

  useEffect(() => {
    let done = true;
    progress?.data?.forEach((item: any) => {
      if (item.type !== 'history' && item.status > 0 && item.status < 3 && item.count > 0) {
        done = false;
      }
    });
    if (done) {
      clearInterval(timer);
    }
  }, [progress, timer]);

  const setAutoAddStatus = () => {
    setAutoAdd(!autoAdd);
    chrome.runtime.sendMessage({ type: 'setAutoAddStatus', status: !autoAdd })
  }

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
          //backgroundColor: 'rgba(255, 255, 255, 0.6)',
        }
      }
      getContainer={() => getDocument().getElementById('mindecho-sidebar-flat') || document.body}>
      <div className={styles.container}>
        <Input.TextArea
          id="mindecho-ask-input"
          autoSize={false}
          rows={2}
          placeholder="Ask Your Saves"
          onPressEnter={(e) => {
            e.preventDefault(); // 阻止回车换行，直接提交
            console.log(e.currentTarget.value);
            const value = e.currentTarget.value;
            if (value?.trim()) {
              // chrome.runtime.sendMessage(
              //   {
              //     type: 'ws_chat_request',
              //     data: {
              //       message: value?.trim(),
              //       action: 'message',
              //     },
              //   },
              //   (res) => {
              //     console.log('ws_chat_request res: ', res);
              //   },
              // );
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
        <p className={styles['example']}>
          E.g. “*{example.title ? truncateTitle(example.title) : 'No data available'}*”
        </p>
        <div className={styles.enter}>
          <EnterImage />
        </div>
      </div>
      <div className={styles['source-container']}>
        {/* 靠左 koman */}
        <div className={styles.right}>
          <span className={styles.title}>Sources</span>
          <MyProgress />
        </div>
        <MoreOutlined style={{ cursor: 'pointer' }} onClick={() => { setShowSettings(!showSettings) }} />
        {/* 靠右 koman */}
        {/* <span className={styles.title}>Sources</span>
        <div className={styles.right}>
          <MyProgress />
          <MoreOutlined style={{ cursor: 'pointer' }} onClick={() => { setShowSettings(!showSettings) }} />
        </div> */}
      </div>
      {
        showSettings && (
          <div className={styles['setting']}>
            <p className={styles['title']}>Settings</p>
            <p className={styles['text']}>
              <Switch checked={autoAdd} onChange={setAutoAddStatus} size="small" className={styles.switch} /><span>Auto-add New Items</span>
            </p>
            <CloseOutlined onClick={() => { setShowSettings(false) }} className={styles['close-setting-btn']} />
          </div>
        )
      }
    </Modal>
  );
};

export default AskModal;
