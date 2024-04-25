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
    setActionListener();
    if (type === 'options') {
      handleLogin();
    } else {
      chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (res) => {
        console.log('userinfo res:', res);
        handleLogin();
      });
    }
  }, []);

  const setActionListener = () => {
    document.addEventListener('keydown', function (event) {
      // 检查是否按下了 'E' 键
      if (event.key === 'e' || event.key === 'E') {
        // 对于 Mac 用户，event.metaKey 是 Command 键
        // 对于 Windows 用户，event.ctrlKey 是 Ctrl 键
        if (event.metaKey || event.ctrlKey) {
          // 阻止默认的行为（如果有的话）
          event.preventDefault();
          // 执行你的代码
          shouldShowModal();
        }
      }
    });
  }

  const onBackendMessage = useCallback((request: any) => {
    console.log('onBackendMessage:', request);
    if (request.type === 'showAskModal') {
      shouldShowModal();
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onBackendMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onBackendMessage);
    };
  }, []);

  const shouldShowModal = () => {
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
