import React from 'react';
import { UserInfo } from '@/types';

export const ContentTypeMap: { [key: string]: string } = {
  bookmark: 'Bookmarks',
  readinglist: 'Reading List',
  history: 'History',
  pocket: 'Pocket',
  x: 'X',
}


// status 0初始化 1用户确认启动抓取  2开始抓取 3抓取成功 4抓取失败 5title抓取完成
export enum ContentProcessStatusMap {
  Init = 0,
  UserConfirm = 1,
  Start = 2,
  Success = 3,
  Fail = 4,
  TitleFinish = 5
}

export const ContentProcessStatusLabelMap: { [key: number]: string } = {
  0: 'Init',
  1: 'UserConfirm',
  2: 'Start',
  3: 'Success',
  4: 'Fail',
  5: 'TitleFinish'
}

/** 弹窗类型 */
export enum enumSubscribeModalType {
  Premium,
  Elite,
}
// export interface IPageInfo {
//   title: String;
//   url: String;
//   type: "history";
//   user_create_time: String;
//   node_id: 0;
//   node_index: 0;
//   parentId: 0;
//   user_used_time: String;
//   origin_info: any;
//   author: String;
//   content: String;
//   status: 3;
// }

export interface INav {
  title: string;
  action: string;
}

export const NavigationMap: INav[] = [
  { title: 'Collection', action: 'collection' },
  { title: 'Manages Sources', action: 'manages-sources' },
];

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
export interface IProgressItem {
  count: number;
  status: 0 | 1 | 2 | 3 | 4 | 5;
  type?: string
}
export interface ITitleMap {
  [key: string]: string;
}
export interface IState {
  titleMap: ITitleMap;
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
  /** 是否需要登录 */
  isLogin: boolean;
  /** 用户信息 */
  userInfo?: UserInfo | null;
  /** 上传进度 */
  progress?: Array<IProgressItem> | null;
  /** 历史网页数据 **/
  // historyPage?: Array<IPageInfo> | [];
  // historyId: number;
  // nav
  nav: string;
}

export enum ActionType {
  // SetHistoryPage = 'SET_HISTORY_PAGE',
  /** 设置upateData */
  SetTitleMap = 'SET_TITLEMAP',
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
  SetIsLogin = 'SetIsLogin',
  SetUserInfo = 'SetUserInfo',
  SetProgress = 'SetProgress',
  SetNav = 'SetNav',
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
  | ISetMarkdownStream
  | ISetIsLogin
  | ISetProgress
  | ISetTitleMap
  | ISetUserInfo
  | ISetNav;


export interface ISetNav {
  type: ActionType.SetNav;
  payload: string;
}

export interface ISetTitleMap {
  type: ActionType.SetTitleMap;
  payload: ITitleMap;
}
export interface ISetProgress {
  type: ActionType.SetProgress;
  payload: Array<IProgressItem> | null;
}
export interface ISetUserInfo {
  type: ActionType.SetUserInfo;
  payload: UserInfo | null;
}

export interface ISetIsLogin {
  type: ActionType.SetIsLogin;
  payload: boolean;
}

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
    // case ActionType.SetHistoryPage:
    //   return {
    //     ...state,
    //     historyId: ++state.historyId,
    //     historyPage: [...state.historyPage as Array<any>, { ...action.payload, id: state.historyId || 0 }],
    //   };

    case ActionType.SetTitleMap:
      return {
        ...state,
        titleMap: action.payload,
      };

    case ActionType.SetProgress:
      return {
        ...state,
        progress: action.payload,
      };

    case ActionType.SetUserInfo:
      return {
        ...state,
        userInfo: action.payload,
      };

    case ActionType.SetIsLogin:
      return {
        ...state,
        isLogin: action.payload,
      };

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

    case ActionType.SetNav:
      return {
        ...state,
        nav: action.payload,
      };

    default:
      throw new Error();
  }
}

const context = React.createContext(
  {
    nav: NavigationMap[0].action
  } as unknown as {
    state: IState;
    dispatch: React.Dispatch<IAction>;
  },
);

export default context;
