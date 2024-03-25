import React, { useState, useContext, useEffect } from 'react';
import { Modal, Input, Spin, Switch } from 'antd';
import { MoreOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { getDocument } from '@/utils/common.util';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import { SetInterval } from '@/utils/common.util';
import _ from 'lodash';
import EnterImage from '@/assets/img/enter.svg';
import styles from './index.module.scss';
import { render } from 'react-dom';

interface IExample {
  title: string;
  url: string;
}

interface IProgressData {
  title: string;
  count: number;
  pended: number;
}
interface IProps {
  type?: 'options' | 'webPage'
}

const AskModal: React.FC<IProps> = ({ type = 'webPage' }) => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { showAskModal, showAnswerModal, progress } = globalState;
  const [example, setExample] = useState<IExample>({ title: '', url: '' });
  const [progressData, setProgressData] = useState<Array<IProgressData>>([])
  const [showSettings, setShowSettings] = useState(true);
  const [autoAdd, setAutoAdd] = useState(true);

  useEffect(() => {
    if (showAskModal) {
      setTimeout(() => {
        getDocument().getElementById('mindecho-ask-input')?.focus();
      }, 500);
    }
  }, [showAskModal]);

  SetInterval(() => {
    type === 'webPage' && getProgress();
  }, 5000)

  const getProgress = () => {
    console.log(111111, type)

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
    chrome.runtime.sendMessage({ type: 'request', api: 'get_user_recent' }, (res) => {
      console.log('get_user_recent res: ', res);
      const { title, url } = res;
      setExample({
        title,
        url,
      })
    });
    type === 'webPage' && getProgress()

    chrome.storage.local.get(['mindecho-auto-add']).then((result: any) => {
      setAutoAdd(result['mindecho-auto-add'])
    });
  }, []);

  const setAutoAddStatus = () => {
    setAutoAdd(!autoAdd);
    chrome.runtime.sendMessage({ type: 'setAutoAddStatus', status: !autoAdd })
  }

  useEffect(() => {
    if (_.isArray(progress?.data)) {
      // let resData = {
      //   bookmark: { count: 0, pended: 0 },
      //   readinglist: { count: 0, pended: 0 },
      //   history: { count: 0, pended: 0 },
      // }
      let resData = [
        { title: 'Bookmarks', count: 0, pended: 0 },
        { title: 'Reading List', count: 0, pended: 0 },
        { title: 'history', count: 0, pended: 0 },
      ]
      progress?.data?.forEach((item: any) => {
        if (item.status > 0) {
          switch (item.type) {
            case 'bookmark':
              resData[0].count += item.count;
              if (item.status >= 3) {
                resData[0].pended += item.count;
              }
              break;
            case 'readinglist':
              resData[1].count += item.count;
              if (item.status >= 3) {
                resData[1].pended += item.count;
              }
              break;
            case 'history':
              resData[2].count += item.count;
              if (item.status >= 3) {
                resData[2].pended += item.count;
              }
              break;
          }
        }
      })
      setProgressData(resData)
    }
  }, [progress])

  const renderProgress = () => {
    return progressData.map((item, index) => {
      return (
        <div className={styles.items} key={item.title}>
          <span className={styles['source-title']}>{item.title}</span>
          {
            item.pended !== item.count ? (
              <>
                <Spin size="small" style={{ margin: '0 5px' }} />
                <p className={styles['source-stauts']}><span className={styles['success']}>{item.pended}</span>/{item.count}</p>
              </>

            ) : (
              <>
                <CheckCircleOutlined className={styles['success-icon']} />
                <p className={styles['source-stauts']}><span className={styles['success']}>{item.pended}</span></p>
              </>
            )
          }
        </div>
      )
    })
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
        <a href={example.url} target="_blank">
          <p className={styles['example']}>
            E.g. “*{example.title ? example.title : 'No data available'}*”
          </p>
        </a>
        <div className={styles.enter}>
          <EnterImage />
        </div>
      </div>
      <div className={styles['source-container']}>
        <span className={styles.title}>Sources</span>
        {
          renderProgress()
        }
        <MoreOutlined style={{ cursor: 'pointer' }} onClick={() => { setShowSettings(!showSettings) }} />
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
