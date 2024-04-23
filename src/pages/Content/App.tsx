import { getDocument } from '@/utils/common.util';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AskModal from './components/AskModal';
import AnswerModal from './components/AnswerModal';
import GlobalContext, { ActionType as GlobalActionType, IState } from '../../reducer/global';

interface IProps {
  type?: 'options' | 'webPage'
}

const App: React.FC<IProps> = ({ type = 'webPage' }) => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);

  const flatRoot = type === 'options' ? document.body : getDocument().getElementById('mindecho-sidebar-flat');

  const handleLogin = (callback?: (result: any) => void) => {
    // 查询是否登录
    chrome.storage.local.get(['isLogin', 'userInfo']).then((result) => {
      console.log("🚀 ~ chrome.storage.local.get ~ result:", result)
      globalDispatch({
        type: GlobalActionType.SetIsLogin,
        payload: result.isLogin,
      });
      globalDispatch({
        type: GlobalActionType.SetUserInfo,
        payload: result.userInfo,
      });
      callback?.(result);
    });
  };

  const setShowAskModal = (value: boolean) => {
    globalDispatch({
      type: GlobalActionType.SetShowAskModal,
      payload: value,
    });
  };

  useEffect(() => {
    if (type === 'options') {
      handleLogin();
    } else {
      chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
        console.log('userinfo res:', res);
        handleLogin();
      });
    }
  }, []);

  const onBackendMessage = useCallback((request: any) => {
    if (request.type === 'showAskModal') {
      handleLogin((result) => {
        if (!result.isLogin) {
          chrome.runtime.sendMessage(
            {
              type: 'openSettings',
            },
            () => {
              //
            },
          );
        } else {
          setShowAskModal(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  return (
    <>
      {flatRoot && (
        <>
          {createPortal(<AskModal type={type} />, flatRoot)}
          {createPortal(<AnswerModal />, flatRoot)}
        </>
      )}
    </>
  );
};

export default App;
