import React, { useEffect, useReducer, useState } from 'react';
import './Options.css';
import { ConfigProvider, message, Spin } from 'antd';
import User, { SubType } from './components/user/User';
import Login from './components/login/Login';
import BrowserData from './components/browserData/browserData';
import HistoryData from './components/historyData/historyData';
import Building from './components/building/building';
import Pocket from './components/pocketData/pocket';
import { UserInfo, UserType } from '@/types';
import GlobalContext, {
  reducer as GlobalReducer,
  ActionType as GlobalActionType,
  enumSubscribeModalType,
} from '../../reducer/global';
import _ from 'lodash';
import styles from './Options.module.scss';
// import { BrowserRouter } from 'react-router-dom';

import ModalContent from '../Content/App';

interface ILinkProps {
  page: number;
  status?: false
}

const Options: React.FC = () => {
  const [buildStatus, setBuildStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stepPage, setStepPage] = useState(1);
  const [userinfo, setUserinfo] = useState<UserInfo>();
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [gloablState, globalDispatch] = useReducer(GlobalReducer, {
    titleMap: { bookmark: 'Bookmarks', readinglist: 'Reading List', history: 'History', pocket: 'Pocket' },
    userInfo: {} as UserInfo,
    showAskModal: false,
    language: '',
    showAnswerModal: false,
    isRequesting: false,
    requestEnd: false,
    isLogin: false,
  });
  const [buildType, setBuildType] = useState<string>('');

  const handleLogin = () => {
    chrome.storage.local.get(['isLogin']).then((result) => {
      console.log(result);
      setIsLogin(result.isLogin);
    });
  };

  const toLogin = () => {
    chrome.runtime.sendMessage({ type: 'login', data: {} }, (res) => {
      console.log('login res:', res);
      //发送用户身份信息
      const event_name = "plugin_click_login"
      console.log('posthog event_name', event_name);
      //posthog.capture(event_name )
      if (!res || res.error) {
        console.log('登陆错误');
      }
    });
  };

  const onLoginBack = (request: any, sender: any, sendResponse: any) => {
    if (request === 'http-error') {
      message.error(chrome.i18n.getMessage('errorDefault'));
    }
    if (request.type === 'setLogin') {
      console.log('content msg:', request, sender);
      if (request.isLogin === true) {
        chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
          if (res) {
            setUserinfo(res.result);
            globalDispatch({
              type: GlobalActionType.SetUserInfo,
              payload: res.result,
            });
            globalDispatch({
              type: GlobalActionType.SetLanguage,
              payload: res.result.lang_type,
            });
          }
        });
      }
      handleLogin();
      sendResponse('setLogin ok');
    }
  }

  useEffect(() => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
      setLoading(false);
      console.log('options userInfo res:', res);

      handleLogin();
      // if (!res || res.error) {
      //   console.log('用户未登陆');
      // } else if (res.result) {
      //   console.log('content user:', res.result);
      //   setUserinfo(res.result);
      //   globalDispatch({
      //     type: GlobalActionType.SetUserInfo,
      //     payload: res.result,
      //   });
      //   globalDispatch({
      //     type: GlobalActionType.SetLanguage,
      //     payload: res.result.lang_type,
      //   });
      // }
    });
    chrome.runtime.onMessage.addListener(onLoginBack);
    return () => {
      chrome.runtime.onMessage.removeListener(onLoginBack);
    };
  }, []);

  useEffect(() => {
    //发送用户身份信息
    chrome.runtime.sendMessage(
      {
        type: 'getCookie',
        key: 'distinct_id',
      },
      (cookie: object) => {
        const distinct_id = _.get(cookie, 'data.value', '');
        console.log('distinct_id', distinct_id);
      },
    );
  }, [userinfo?.id]);

  return (
    <GlobalContext.Provider
      value={{
        state: gloablState,
        dispatch: globalDispatch,
      }}>
      <div className={styles['options-container']}>
        <ConfigProvider>
          <Spin spinning={loading}>
            {loading ? null : !isLogin ? (
              <>
                <Login onLogin={toLogin} />
              </>
            ) : (
              <>
                {stepPage === 1 ? <User onLink={(page: number) => { setStepPage(page) }} /> :
                  stepPage === 2 ? <BrowserData onLink={(page: number, status = false) => { setStepPage(page); setBuildType('browser'); setBuildStatus(status) }} /> :
                    stepPage === 5 ? <HistoryData onLink={(page: number, status = false) => { setStepPage(page); setBuildType('browser'); setBuildStatus(status) }} /> :
                      stepPage === 3 ? <Building type={buildType} status={buildStatus} /> :
                        stepPage === 4 ? <Pocket onLink={(page: number) => { setStepPage(page); setBuildType('pocket') }} /> : null}
                <ModalContent type="options" />
              </>
            )}
          </Spin>
        </ConfigProvider>
      </div>
    </GlobalContext.Provider>
  )
};

export default Options;
