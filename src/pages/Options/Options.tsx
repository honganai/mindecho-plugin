import React, { useEffect, useReducer, useState } from 'react';
import './Options.css';
import { ConfigProvider, message, Spin } from 'antd';
import User, { SubType } from './components/user/User';
import Login from './components/login/Login';
import BrowserData from './components/browserData/browserData';
import HistoryData from './components/historyData/historyData';
import Building from './components/building/building';
import Pocket from './components/pocketData/pocket';
import Twitter from './components/twitter/twitter';
import { UserInfo, UserType } from '@/types';
import GlobalContext, {
  reducer as GlobalReducer,
  ActionType as GlobalActionType,
  enumSubscribeModalType,
} from '../../reducer/global';
import _ from 'lodash';
// import styles from './Options.module.scss';
import { getIsLogin } from '@/constants';
import ModalContent from '../Content/App';
import { handleLogin } from '@/utils/common.util';
import clsx from 'clsx';
import { FullScreenLoading } from './components/user/FullScreenLoading';
import { motion, AnimatePresence } from "framer-motion";
import Header from './components/header/header';
import { Navigation } from './Navigation';

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
  const { getMessage: t } = chrome.i18n;

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

  const headerNoticeMap = [

    {
      tip: t('how_about_we_begin_by_choosing_the_treasure_trove_of_information_you_d_like_to_explore_again')
    },
    {
      tip: t('select_content_to_be_made_searchable'),
    },
    {
      tip: t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization'),
    },
    {
      tip: t('connect_to_pocket_to_revive_your_dusty_stash'),
    },
    {
      tip: t('enable_full_text_search_in_browsing_history_to_eliminate_the_need_for_memorization'),
      note: t('only_URLs_of_public_articles_blogs_and_essay_PDFs_can_be_included_personal_and_work_related_history_are_NOT_included')
    },
    {
      tip: t('enable_search_for_your_X_bookmarks'),
    }
  ]


  const { nav } = gloablState;
  useEffect(() => { nav === 'collection' && setStepPage(1) }, [nav])

  return (
    <GlobalContext.Provider
      value={{
        state: gloablState,
        dispatch: globalDispatch,
      }}>
      <div className={clsx(`bg-white`)}>
        <ConfigProvider>

          <AnimatePresence>
            <div className='w-full h-screen flex flex-col'>
              {
                isLogin &&
                <div className='p-4 pt-6' >
                  <Header tip={(headerNoticeMap[stepPage - 1].tip || '')} note={headerNoticeMap[stepPage - 1].note || ''} />
                </div>
              }

              <div className='flex-1 h-0 flex'>
                {loading ? <FullScreenLoading />
                  : !isLogin ? (
                    <>
                      <Login onLogin={toLogin} />
                    </>
                  ) : (
                    <>
                      <Navigation />

                      {stepPage === 1 ? <User onLink={(page: number) => { setStepPage(page) }} /> :
                        stepPage === 2 ? <BrowserData onLink={(page: number, status = false) => { setStepPage(page); setBuildType('browser'); setBuildStatus(status) }} /> :
                          stepPage === 5 ? <HistoryData onLink={(page: number, status = false) => { setStepPage(page); setBuildType('browser'); setBuildStatus(status) }} /> :
                            stepPage === 3 ? <Building type={buildType} status={buildStatus} /> :
                              stepPage === 4 ? <Pocket onLink={(page: number) => { setStepPage(page); setBuildType('pocket') }} /> :
                                stepPage === 6 ? <Twitter onLink={(page: number) => { setStepPage(page) }} /> : null}
                      <ModalContent type="options" />
                    </>
                  )}
              </div>
            </div>





          </AnimatePresence>

        </ConfigProvider>
      </div>
    </GlobalContext.Provider >
  )
};

export default Options;
