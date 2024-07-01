import React, { useEffect, useReducer, useState } from 'react';
import './Options.css';
import { ConfigProvider, message, Spin } from 'antd';
import Login from './components/login/Login';
import { UserInfo, UserType } from '@/types';
import GlobalContext, {
  reducer as GlobalReducer,
  ActionType as GlobalActionType,
  enumSubscribeModalType,
} from '../../reducer/global';
import _ from 'lodash';
// import styles from './Options.module.scss';
import ModalContent from '../Content/App';
import { handleLogin } from '@/utils/common.util';
import clsx from 'clsx';
import { FullScreenLoading } from './components/user/FullScreenLoading';
import ManagesSources from '@/pages/Options/pages/manageSources';
import { motion, AnimatePresence } from "framer-motion";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { ApplicationLayout } from './Layout';
import { Collections } from './pages/collections';

import BrowserData from '@/pages/Options/pages/manageSources/browserData/browserData';
import HistoryData from '@/pages/Options/pages/manageSources/historyData/historyData';
import Building from '@/pages/Options/pages/manageSources/building/building';
import Pocket from '@/pages/Options/pages/manageSources/pocketData/pocket';
import Twitter from '@/pages/Options/pages/manageSources/twitter/twitter';


const Options: React.FC = () => {
  const [buildStatus, setBuildStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stepPage, setStepPage] = useState(1);
  const [userinfo, setUserinfo] = useState<UserInfo>();
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [globalState, globalDispatch] = useReducer(GlobalReducer, {
    titleMap: {
      bookmark: 'Bookmarks',
      readinglist: 'Reading List',
      history: 'History',
      pocket: 'Pocket',
      xbookmark: 'X Bookmarks'
    },
    userInfo: {} as UserInfo,
    showAskModal: false,
    language: '',
    showAnswerModal: false,
    isRequesting: false,
    requestEnd: false,
    isLogin: false,
  });
  const [buildType, setBuildType] = useState<
    'xbookmark' |
    'browser' |
    'pocket' |
    ''
  >('');
  const { getMessage: t } = chrome.i18n;

  const toLogin = () => {
    chrome.runtime.sendMessage({ type: 'login', data: {} }, (res) => {

      // 清除token


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
        chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (result) => {
          handleLogin((res: any) => { successFn(res) });
        });
      }
      sendResponse('setLogin ok');
    }
  }

  //判断已经设置过用户信息、登录状态的缓存时，直接使用
  const successFn = (res: any) => {
    const { isLogin, userInfo } = res;
    setIsLogin(isLogin)
    setUserinfo(userInfo);
    globalDispatch({
      type: GlobalActionType.SetUserInfo,
      payload: userInfo,
    });
    globalDispatch({
      type: GlobalActionType.SetLanguage,
      payload: userInfo.lang_type,
    });
  }

  useEffect(() => {
    localStorage.theme = 'light'

    setLoading(true);
    handleLogin(
      (res: any) => {
        setLoading(false);
        successFn(res);
      },
      //如果没有登录，则等用户点击登陆按钮
      () => {
        setLoading(false);
      }
    );

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

  const { nav } = globalState;
  useEffect(() => { nav === 'collection' && setStepPage(1) }, [nav])

  return (
    <Router>
      <GlobalContext.Provider
        value={{
          state: globalState,
          dispatch: globalDispatch,
        }}>
        <div className={clsx(`bg-white`)}>
          <ConfigProvider>
            <AnimatePresence>
              {loading ? <FullScreenLoading />
                : !isLogin ? (
                  <>
                    <Login onLogin={toLogin} />
                  </>
                ) : (

                  <ApplicationLayout>
                    <Routes>
                      <Route path='' element={<Navigate to="/collection" />} />
                      <Route path='/collection' element={<Collections />} />
                      <Route path='/manage-sources'>
                        <Route path='' element={<ManagesSources />}></Route>
                        <Route path='browser-data' element={<BrowserData />} />
                        <Route path='history-data' element={<HistoryData />} />
                        <Route path='building' element={<Building />} />
                        <Route path='pocket' element={<Pocket />} />
                        <Route path='twitter' element={<Twitter />} />
                      </Route>
                    </Routes>

                    {/* {stepPage === 1 ? <User onLink={(page: number) => { setStepPage(page) }} /> :
                          stepPage === 2 ? <BrowserData onLink={(page: number, status = false) => { setStepPage(page); setBuildType('browser'); setBuildStatus(status) }} /> :
                            stepPage === 5 ? <HistoryData onLink={(page: number, status = false) => { setStepPage(page); setBuildType('browser'); setBuildStatus(status) }} /> :
                              stepPage === 3 ? <Building type={buildType} status={buildStatus} /> :
                                stepPage === 4 ? <Pocket onLink={(page: number) => { setStepPage(page); setBuildType('pocket') }} /> :
                                  stepPage === 6 ? <Twitter onLink={(page: number) => { setStepPage(page), setBuildType('xbookmark') }} /> : null} */}

                    <ModalContent type="options" />
                  </ApplicationLayout>
                )}
            </AnimatePresence>
          </ConfigProvider>
        </div>
      </GlobalContext.Provider >
    </Router >
  )
};

export default Options;
