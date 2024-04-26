import { getDocument, handleLogin } from '@/utils/common.util';
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

  const setShowAskModal = (value: boolean) => {
    globalDispatch({
      type: GlobalActionType.SetShowAskModal,
      payload: value,
    });
  };

  //判断已经设置过用户信息、登录状态的缓存时，直接使用
  const successFn = (res: any) => {
    const { isLogin, userInfo } = res;
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
    setActionListener();

    handleLogin(
      (res: any) => {
        successFn(res);
      },
      //如果没有登录，调登陆接口
      () => {
        chrome.runtime.sendMessage({ type: 'request', api: 'userinfo' }, (result) => {
          console.log('userinfo res:', result);
          handleLogin((res: any) => successFn(res));
        });
      }
    );
  }, []);

  //快捷键监听
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
    handleLogin((res: any) => {
      setShowAskModal(true);
    }, () => {
      chrome.runtime.sendMessage(
        {
          type: 'openSettings',
        },
        () => {
          //
        },
      );
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
