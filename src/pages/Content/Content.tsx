import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Layout, Tabs, ConfigProvider, Popover, message, Spin, notification, Select } from 'antd';
import { CloseOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';
import type { TabsProps, MenuProps } from 'antd';
import { Dropdown } from 'antd';
import _ from 'lodash';
import { getDocument } from '@/utils/common.util';

import Distilling from './components/distilling/Distilling';
import Chat from './components/chat/Chat';
import Memories from './components/memories/Memories';
import Thinking from './components/thinking/Thinking';
import User, { SubType } from './components/user/User';
import Login from './components/login/Login';

import styles from './content.module.scss';
import getCleanArticle from './distillConfig';
import { UserInfo, UserType } from '@/types';
import { LANGUAGE_COLLECTIONS, PLACEHOLDER, POSTHOG_KEY } from '@/constants';
import GlobalContext, {
  reducer as GlobalReducer,
  ActionType as GlobalActionType,
  enumSubscribeModalType,
} from '../../reducer/global';
import posthog from 'posthog-js';
const { Header } = Layout;
interface Props {
  title?: string;
}

interface MessageData {
  [key: string]: string[];
}

// message全局配置
notification.config({
  getContainer: () => getDocument().getElementById('linnk-sidebar') as HTMLElement,
});
message.config({
  getContainer: () => getDocument().getElementById('linnk-sidebar') as HTMLElement,
});

const Options: React.FC<Props> = ({ title }: Props) => {
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [openUserInfo, setOpenUserInfo] = useState(false);
  const [openLangSelect, setOpenLangSelect] = useState(false);
  const [userinfo, setUserinfo] = useState<UserInfo>();
  const [activeKey, setActiveKey] = useState<string>('1');
  const projectName = chrome.i18n.getMessage('projectName');
  const [noteList, setNoteList] = useState([]);
  posthog.init(POSTHOG_KEY, { api_host: 'https://us.posthog.com' });
  const guideRefs = useRef({});

  const [gloablState, globalDispatch] = useReducer(GlobalReducer, {
    showSubscribeModal: false,
    language: '',
    cleanArticle: getCleanArticle(),
    guideRefs,
    showGuide: false,
  });

  useEffect(() => {
    setActiveKey('1');
  }, [gloablState.language]);

  const img = chrome.runtime.getURL('logo.png');
  const handleLogin = () => {
    chrome.storage.local.get(['isLogin']).then((result) => {
      console.log(result);
      setIsLogin(result.isLogin);
    });
  };

  // 检查是否完成支付
  const checkPay = (callback: (userinfo: UserInfo) => void) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
      if (res) {
        callback(res.result);
        setUserinfo(res.result);
      }
    });
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: chrome.i18n.getMessage('tab1'),
      children: <Distilling userinfo={userinfo} checkPay={checkPay} />,
    },
    // {
    //   key: '2',
    //   label: chrome.i18n.getMessage('tab2'),
    //   children: <Chat userinfo={userinfo} message={message} />,
    // },
    /* {
      key: '3',
      label: chrome.i18n.getMessage('tab3'),
      children: <Memories userinfo={userinfo} />,
    },*/
    {
      key: '4',
      label: chrome.i18n.getMessage('thinking'),
      children: <Thinking userinfo={userinfo} />,
    },
    // {
    //   key: '5',
    //   label: '',
    //   children: <User userinfo={userinfo} />,
    // },
  ];
  const toLogin = () => {
    chrome.runtime.sendMessage({ type: 'login', data: {} }, (res) => {
      console.log('login res:', res);
      //发送用户身份信息
      const event_name="plugin_click_login"
      console.log('posthog event_name', event_name);
      posthog.capture(event_name )
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
        userinfo?.id &&
          distinct_id != '' &&
          posthog.identify(distinct_id, { email: userinfo.email, name: userinfo.username }, { first_visited_url: '' });
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

  // 定义初始数据类型
  const onChange = (key: string) => {
    chrome.storage.local.set({ key: key }, function () {
      console.log('key is ' + key);
    });
    setActiveKey(key);
    console.log('change key: ', key);
    if (key === '1') {
      // article-distill
      // chrome.runtime.sendMessage({ type: 'testApi' }, (res) => {
      //   console.log('test res:', res);
      // });
    }

    if (key === '2') {
      // chat
    }

    if (key === '3') {
      // notes history
      chrome.runtime.sendMessage({ type: 'request', api: 'article-note-[list]' }, (res) => {
        console.log('notes list res:', res.result);
        setNoteList(res.result);
      });
    }
  };
  const onClose = () => {
    console.log('close');
    const linkEl = getDocument().getElementById('linnk-sidebar');
    if (linkEl) linkEl.style.display = 'none';
    chrome.runtime.sendMessage({ type: 'close' }, (res) => {
      console.log('关闭完成', res);
    });
  };
  const getPopupContainer = (triggerNode: any) => {
    if (triggerNode && triggerNode.parentNode) {
      return triggerNode.parentNode;
    }
    return getDocument().getElementById('linnk-sidebar');
  };

  const dropItems = LANGUAGE_COLLECTIONS.map((lc) => {
    return {
      value: lc.localeCode,
      label: (
        <>
          <span className={styles['language-show']}>{lc.showLang}</span>
          <span className={styles['language-region']}>{lc.regionLang}</span>
        </>
      ),
    };
  });
  const dropOnClick = (key: string) => {
    setOpenLangSelect(false);
    updateUserLanguage(key);
  };
  const updateUserLanguage = (selectedLanguage: string) => {
    let languageShowTextHit = LANGUAGE_COLLECTIONS.find((langItem) => langItem.localeCode === selectedLanguage);
    if (!languageShowTextHit) {
      languageShowTextHit = { localeCode: selectedLanguage, regionLang: selectedLanguage, showLang: selectedLanguage };
    }
    const originMsg = `${chrome.i18n.getMessage('selectedLanguageMessage')} ${languageShowTextHit.showLang}`;
    message.info(originMsg);
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'updateUserLanguage',
        body: {
          lang_type: selectedLanguage,
        },
      },
      (res) => {
        globalDispatch({
          type: GlobalActionType.SetLanguage,
          payload: res.lang_type,
        });
        console.log('user change language', res);
      },
    );
  };

  return (
    <GlobalContext.Provider
      value={{
        state: gloablState,
        dispatch: globalDispatch,
      }}>
      <div id="linnk-plugin-content" className={styles.container}>
        <ConfigProvider>
          <Header className={styles.header}>
            <div className={styles['header-logo']}>
              <img className={styles.logo} src={img} />
              <span className={styles.name}></span>
            </div>
            <div className={styles['header-user']}>
              {!isLogin && (
                <Dropdown
                  overlayClassName={styles['header-language']}
                  trigger={['click']}
                  open={openLangSelect}
                  onOpenChange={(open) => {
                    setOpenLangSelect(open);
                  }}
                  dropdownRender={() => {
                    return (
                      <div>
                        <div className={styles['language-title']}>{chrome.i18n.getMessage('selectLang')}</div>
                        <Select
                          className={styles['language-select']}
                          onChange={dropOnClick}
                          defaultValue={gloablState.language || 'auto'}
                          options={dropItems}
                          getPopupContainer={() =>
                            getDocument().getElementById('linnk-plugin-content') || document.body
                          }></Select>
                      </div>
                    );
                  }}
                  getPopupContainer={getPopupContainer}>
                  <span className={styles['header-user-icon']} onClick={(e) => e.preventDefault()}>
                    <GlobalOutlined style={{ color: '#000' }} />
                  </span>
                </Dropdown>
              )}
              {!isLogin && (
                <Dropdown
                  open={openUserInfo}
                  onOpenChange={(open) => {
                    setOpenUserInfo(open);
                  }}
                  overlayClassName={styles['header-userinfo']}
                  dropdownRender={() => <User userinfo={userinfo} />}
                  placement="bottomRight"
                  getPopupContainer={getPopupContainer}
                  trigger={['click']}>
                  <span className={styles['header-user-icon']}>
                    <UserOutlined style={{ color: '#000' }} />
                  </span>
                </Dropdown>
              )}
              <CloseOutlined onClick={onClose} style={{ color: '#000' }} />
            </div>
          </Header>
          <Spin spinning={loading}>
            {loading ? null : isLogin ? (
              <>
                <Login onLogin={toLogin} />
              </>
            ) : (
              <Tabs
                className={styles.tabs}
                defaultActiveKey="1"
                activeKey={activeKey}
                items={items}
                onChange={onChange}
              />
            )}
          </Spin>
        </ConfigProvider>
      </div>
    </GlobalContext.Provider>
  );
};

export default Options;
