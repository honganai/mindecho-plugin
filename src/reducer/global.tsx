import React from 'react';

/** 弹窗类型 */
export enum enumSubscribeModalType {
  Premium,
  Elite,
}
export interface IUpateData {
  url: string;
  status: 1 | 0;
}
export interface IHistory {
  id: string;
  lastVisitTime: number;
  title: string;
  typedCount: number;
  url: string;
  visitCount: number;
}
export interface IBookmarks {
  id: string;
  title: string;
  dateAdded: number;
  url?: string;
  dateGroupModified?: number;
  parentId?: string;
  index?: number;
  children?: Array<IBookmarks>;
}
export interface IReadingList {
  creationTime: number;
  lastUpdateTime: number;
  title: string;
  hasBeenRead: boolean;
  url: string;
}
export interface IState {
  /** 等待更新的数据 */
  upateData?: Array<IUpateData>;
  /** 历史记录 */
  history?: Array<IHistory>;
  /** 标签列表 */
  bookmarks?: IBookmarks;
  /** 阅读书签 */
  readinglist?: Array<IReadingList>;
  /** 显示问题弹窗 */
  showAskModal: boolean;
  /** 当前语言 */
  language: string;
  /** 显示回答弹窗 */
  showAnswerModal: boolean;
  /** 问题 */
  question?: string;
  /** 正在请求答案 */
  isRequesting: boolean;
  /** 请求答案完毕 */
  requestEnd: boolean;
  /** 回答 */
  markdownStream?: string;
}

export enum ActionType {
  /** 设置upateData */
  SetUpateData = 'SET_UPATEDATA',
  /** 设置history */
  SetHistory = 'SET_HISTORY',
  /** 设置bookmarks */
  SetBookMarks = 'SET_BOOKMARKS',
  /** 设置readinglist */
  SetReadingList = 'SET_READINGLIST',

  /** 设置当前语言 */
  SetShowAskModal = 'SetShowAskModal',

  SetLanguage = 'SET_LANGUAGE',
  SetShowAnswerModal = 'SetShowAnswerModal',
  SetQuestion = 'SetQuestion',
  SetIsRequesting = 'SetIsRequesting',
  SetRequestEnd = 'SetRequestEnd',
  SetMarkdownStream = 'SetMarkdownStream',
}

export type IAction =
  ISetUpateData
  | ISetHistory
  | ISetBookMarks
  | ISetReadingList

  | ISetShowAskModal

  | ISetLanguageAction
  | ISetShowAnswerModal
  | ISetQuestion
  | ISetIsRequesting
  | ISetRequestEnd
  | ISetMarkdownStream;

export interface ISetUpateData {
  type: ActionType.SetUpateData;
  payload: Array<IUpateData>;
}
export interface ISetHistory {
  type: ActionType.SetHistory;
  payload: Array<IHistory>;
}
export interface ISetBookMarks {
  type: ActionType.SetBookMarks;
  payload: IBookmarks;
}
export interface ISetReadingList {
  type: ActionType.SetReadingList;
  payload: Array<IReadingList>;
}
export interface ISetMarkdownStream {
  type: ActionType.SetMarkdownStream;
  payload: string;
}
export interface ISetIsRequesting {
  type: ActionType.SetIsRequesting;
  payload: boolean;
}
export interface ISetRequestEnd {
  type: ActionType.SetRequestEnd;
  payload: boolean;
}
export interface ISetShowAskModal {
  type: ActionType.SetShowAskModal;
  payload: boolean;
}

export interface ISetShowAnswerModal {
  type: ActionType.SetShowAnswerModal;
  payload: boolean;
}

export interface ISetLanguageAction {
  type: ActionType.SetLanguage;
  payload: string;
}

export interface ISetQuestion {
  type: ActionType.SetQuestion;
  payload: string;
}

export function reducer(state: IState, action: IAction): IState {
  switch (action.type) {
    case ActionType.SetUpateData:
      return {
        ...state,
        upateData: action.payload,
      };

    case ActionType.SetHistory:
      return {
        ...state,
        history: action.payload,
      };

    case ActionType.SetBookMarks:
      return {
        ...state,
        bookmarks: action.payload,
      };

    case ActionType.SetReadingList:
      return {
        ...state,
        readinglist: action.payload,
      };

    case ActionType.SetMarkdownStream:
      return {
        ...state,
        markdownStream: action.payload,
      };

    case ActionType.SetShowAskModal:
      return {
        ...state,
        showAskModal: action.payload,
      };

    case ActionType.SetShowAnswerModal:
      return {
        ...state,
        showAnswerModal: action.payload,
      };

    case ActionType.SetLanguage:
      return {
        ...state,
        language: action.payload,
      };

    case ActionType.SetQuestion:
      return {
        ...state,
        question: action.payload,
      };

    case ActionType.SetIsRequesting:
      return {
        ...state,
        isRequesting: action.payload,
      };

    case ActionType.SetRequestEnd:
      return {
        ...state,
        requestEnd: action.payload,
      };

    default:
      throw new Error();
  }
}

const context = React.createContext(
  {} as {
    state: IState;
    dispatch: React.Dispatch<IAction>;
  },
);

export default context;
