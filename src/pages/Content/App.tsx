import { getDocument } from '@/utils/common.util';
import React, { useCallback, useContext, useEffect } from 'react';
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

  const onBackendMessage = useCallback((request: any) => {
    if (request.type === 'showAskModal') {
      setShowAskModal(true);
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
          {createPortal(<AskModal />, flatRoot)}
          {createPortal(<AnswerModal />, flatRoot)}
        </>
      )}
    </>
  );
};

export default App;
