import React, { useReducer } from 'react';
import GlobalContext, { reducer as GlobalReducer } from '../../reducer/global';
import App from './App';

const Root: React.FC = () => {
  const [globalState, globalDispatch] = useReducer(GlobalReducer, {
    titleMap: {
      bookmark: 'Bookmarks',
      readinglist: 'Reading List',
      history: 'History',
      pocket: 'Pocket',
      xbookmark: 'X Bookmarks'
    },
    showAskModal: false,
    language: '',
    showAnswerModal: false,
    isRequesting: false,
    requestEnd: false,
    isLogin: true,
  });

  return (
    <GlobalContext.Provider
      value={{
        state: globalState,
        dispatch: globalDispatch,
      }}>
      <App />
    </GlobalContext.Provider>
  );
};

export default Root;
