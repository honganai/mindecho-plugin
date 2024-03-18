import React, { useEffect, useReducer, useRef, useState } from 'react';
import './Options.css';
import { Layout, ConfigProvider, Popover, message, Spin, notification, Select } from 'antd';
import User, { SubType } from './components/user/User';
import Login from './components/login/Login';
import DataList from './components/datalist/datalist';
import Building from './components/building/building';
import { UserInfo, UserType } from '@/types';
import getCleanArticle from './distillConfig';
import GlobalContext, {
  reducer as GlobalReducer,
  ActionType as GlobalActionType,
  enumSubscribeModalType,
} from '../../reducer/global';
import _ from 'lodash';
import styles from './Options.module.scss';
import { BrowserRouter } from 'react-router-dom';

const Options: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [goBuilding, setGoBuilding] = useState(false);
  const [userinfo, setUserinfo] = useState<UserInfo>();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const guideRefs = useRef({});
  const [gloablState, globalDispatch] = useReducer(GlobalReducer, {
    showSubscribeModal: false,
    language: '',
    cleanArticle: getCleanArticle(),
    guideRefs,
    showGuide: false,
  });

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

  const onToList = () => {
  }

  const onToBuild = () => {
    setGoBuilding(true);
  }

  const onLoginBack = (request: any, sender: any, sendResponse: any) => {
    if (request === 'http-error') {
      message.error(chrome.i18n.getMessage('errorDefault'));
    }
    if (request.type === 'setLogin') {
      console.log('content msg:', request, sender);
      if (request.isLogin === false) {
        chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
          if (res) {
            setUserinfo(res.result);
            globalDispatch({
              type: GlobalActionType.SetLanguage,
              payload: res.result.lang_type,
            });
          }
        });
      }
      handleLogin();
    }
    sendResponse('ok');
  };

  useEffect(() => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
      setLoading(false);
      console.log('userinfo res:', res);

      handleLogin();
      if (!res || res.error) {
        console.log('用户未登陆');
        // chrome.runtime.sendMessage({ type: 'login', data: {} }, (res) => {
        //   console.log('login res:', res.result);
        //   if (res.error) {
        //     handleLogin(true)
        //     console.log('登陆错误');
        //   } else {
        //     handleLogin(false)
        //     setUserinfo(res.result);
        //   }
        // });
      } else if (res.result) {
        console.log('content user:', res.result);
        setUserinfo(res.result);
        globalDispatch({
          type: GlobalActionType.SetLanguage,
          payload: res.result.lang_type,
        });
      }
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
        //userinfo?.id &&
        //distinct_id != '' &&
        //posthog.identify(distinct_id, { email: userinfo.email, name: userinfo.username }, { first_visited_url: '' });
      },
    );
  }, [userinfo?.id]);

  useEffect(() => {
    if (userinfo?.subscription?.quota_used_count >= userinfo?.subscription?.total_monthly_quota) {
      // 超过套餐次数弹出充值
      globalDispatch({
        type: GlobalActionType.SetShowSubscribeModal,
        payload: {
          show: true,
          closable: false,
          subscribeModalType:
            userinfo?.subscription?.mem_type === SubType.Free
              ? enumSubscribeModalType.Premium
              : enumSubscribeModalType.Elite,
        },
      });
    }
  }, [userinfo]);

  return (
    <GlobalContext.Provider
      value={{
        state: gloablState,
        dispatch: globalDispatch,
      }}>
      <div className={styles['options-container']}>
        <ConfigProvider>
          <Spin spinning={loading}>
            {loading ? null : isLogin ? (
              <>
                <Login onLogin={toLogin} />
              </>
            ) : (
              goBuilding ? <Building /> :
                <User userinfo={userinfo} onLink={onToBuild} />
            )}
          </Spin>
        </ConfigProvider>
      </div>
    </GlobalContext.Provider>
  )
};

export default Options;
