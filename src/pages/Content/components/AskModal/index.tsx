import React, { useState, useContext, useEffect } from 'react';
import { Modal, Input, Switch } from 'antd';
import { MoreOutlined, CloseOutlined } from '@ant-design/icons';
import { getDocument, truncateTitle, openSettings } from '@/utils/common.util';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import _, { set } from 'lodash';
import EnterImage from '@/assets/img/enter.svg';
import styles from './index.module.scss';
import MyProgress from '../Myprogress';
import { getAutoAdd, setAutoAdd as setStorageAutoAdd } from '@/constants';


interface IExample {
  title: string;
  url: string;
}
interface IProps {
  type?: 'options' | 'webPage'
}

const AskModal: React.FC<IProps> = ({ type }) => {
  const { getMessage: t } = chrome.i18n;
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { showAskModal, showAnswerModal, progress } = globalState;
  const [example, setExample] = useState<IExample>({ title: '', url: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  useEffect(() => {
    if (showAskModal) {
      // 获取示例数据
      chrome.runtime.sendMessage({ type: 'request', api: 'get_user_recent' }, (res) => {
        console.log('get_user_recent res: ', res);
        const { title, url } = res;
        setExample({
          title,
          url,
        })
      });
      getAutoAdd().then(res => {
        setAutoAdd(res);
      })

      // 循环查询进度
      setTimeout(() => {
        getDocument().getElementById('mindecho-ask-input')?.focus();
      }, 500);
      getProgress();
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

  const setAutoAddStatus = () => {
    setAutoAdd(!autoAdd);
    setStorageAutoAdd(!autoAdd);
    //chrome.runtime.sendMessage({ type: 'setAutoAddStatus', status: !autoAdd })
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
          placeholder={t('ask_your_saves')}
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
          E.g. “*{example.title ? truncateTitle(example.title) : t('no_data_available')}*”
        </p>
        <div className={styles.enter}>
          <EnterImage />
        </div>
      </div>
      <div className={styles['source-container']}>
        {/* 靠左 koman */}
        <div className={styles.right}>
          <span className={styles.title}>{t('sources')}</span>
          <MyProgress moreCount={3} />
        </div>
        <MoreOutlined style={{ cursor: 'pointer' }} onClick={() => { setShowSettings(!showSettings) }} />
      </div>
      {
        showSettings && (
          <div className={styles['setting']}>
            <p className={styles['title']}>{t('settings')}</p>
            <p className={styles['text']} style={{ display: type === 'options' ? "none" : 'block' }}>
              <span>{t('manage_sources')}</span>
              <svg width="20" height="20" onClick={() => openSettings()} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ float: 'right', cursor: 'pointer', marginLeft: 'auto' }}>
                <path d="M12.5 6.875V5.3125C12.5 4.8981 12.3354 4.50067 12.0424 4.20765C11.7493 3.91462 11.3519 3.75 10.9375 3.75H3.4375C3.0231 3.75 2.62567 3.91462 2.33265 4.20765C2.03962 4.50067 1.875 4.8981 1.875 5.3125V14.6875C1.875 15.1019 2.03962 15.4993 2.33265 15.7924C2.62567 16.0854 3.0231 16.25 3.4375 16.25H10.9375C11.3519 16.25 11.7493 16.0854 12.0424 15.7924C12.3354 15.4993 12.5 15.1019 12.5 14.6875V13.125" stroke="#6B6B6B" strokeWidth="1.00189" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 6.875L18.1254 10.0004L15 13.1259" stroke="#6B6B6B" strokeWidth="1.00189" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.46094 10H18.125" stroke="#6B6B6B" strokeWidth="1.00189" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* <img src={optionIcon} alt="Manage Sources"  style={{ float: 'right',cursor: 'pointer', width: '20px', height: '20px', marginLeft: 'auto' }} />*/}
            </p>
            <p className={styles['text']}>
              <Switch checked={autoAdd} onChange={setAutoAddStatus} size="small" className={styles.switch} /><span>{t('auto_add_new_items')}</span>
            </p>
            <CloseOutlined onClick={() => { setShowSettings(false) }} className={styles['close-setting-btn']} />
          </div>
        )
      }
    </Modal>
  );
};

export default AskModal;
