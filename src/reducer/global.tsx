import React from 'react';

/** 弹窗类型 */
export enum enumSubscribeModalType {
  Premium,
  Elite,
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
  paretId?: string;
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
  /** 历史记录 */
  history?: Array<IHistory>;
  /** 标签列表 */
  bookmarks?: IBookmarks;
  /** 阅读书签 */
  readinglist?: Array<IReadingList>;

  /** 当前语言 */
  language: string;
  /** 网页内容 */
  cleanArticle: {
    title: string;
    content: string;
    timestrip: string;
  };
  /** 对话id */
  conversationId?: string;
  /** 文章id */
  articleId?: number;
  /** 用于记录用户重点关注的问题 */
  articleDistillId?: string;
  /** 订阅弹窗 */
  showSubscribeModal?: boolean;
  /** 订阅弹窗可关闭 */
  subscribeModalClosable?: boolean;
  subscribeModalType?: enumSubscribeModalType;
  /** 引导相关的dom */
  guideRefs: React.MutableRefObject<Record<string, HTMLElement>>;
  showGuide: boolean;
}

export enum ActionType {
  /** 设置history */
  SetHistory = 'SET_HISTORY',
  /** 设置bookmarks */
  SetBookMarks = 'SET_BOOKMARKS',
  /** 设置readinglist */
  SetReadingList = 'SET_READINGLIST',

  /** 设置当前语言 */
  SetLanguage = 'SET_LANGUAGE',
  SetConversationId = 'SET_CONVERSATIOM_ID',
  SetArticleId = 'SET_ARTICLE_ID',
  SetArticleDistillId = 'SET_ARTICLE_DISTILL_ID',
  SetShowSubscribeModal = 'SET_SHOW_SUBSCRIBE_MODAL',
  SetSubscribeModalClosable = 'SET_SUBSCRIBE_MODAL_CLOSABLE',
  SetShowGuide = 'SET_SHOW_GUIDE',
}

export type IAction =
  | ISetHistory
  | ISetBookMarks
  | ISetReadingList

  | ISetLanguageAction
  | ISetConversationIdAction
  | ISetArticleIdAction
  | ISetArticleDistillIdAction
  | ISetShowSubscribeModal
  | ISetSubscribeModalClosable
  | ISetShowGuide;

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
export interface ISetShowGuide {
  type: ActionType.SetShowGuide;
  payload: boolean;
}
export interface ISetShowSubscribeModal {
  type: ActionType.SetShowSubscribeModal;
  payload: {
    show: boolean;
    closable?: boolean;
    subscribeModalType?: enumSubscribeModalType;
  };
}
export interface ISetSubscribeModalClosable {
  type: ActionType.SetSubscribeModalClosable;
  payload: boolean;
}
export interface ISetLanguageAction {
  type: ActionType.SetLanguage;
  payload: string;
}

export interface ISetConversationIdAction {
  type: ActionType.SetConversationId;
  payload: string;
}

export interface ISetArticleIdAction {
  type: ActionType.SetArticleId;
  payload: string;
}

export interface ISetArticleDistillIdAction {
  type: ActionType.SetArticleDistillId;
  payload: string;
}

export function reducer(state: IState, action: IAction): IState {
  switch (action.type) {
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

    case ActionType.SetLanguage:
      return {
        ...state,
        language: action.payload,
      };

    case ActionType.SetArticleId:
      return {
        ...state,
        articleId: action.payload,
      };

    case ActionType.SetConversationId:
      return {
        ...state,
        conversationId: action.payload,
      };

    case ActionType.SetArticleDistillId:
      return {
        ...state,
        articleDistillId: action.payload,
      };

    case ActionType.SetShowSubscribeModal:
      return {
        ...state,
        showSubscribeModal: action.payload.show,
        subscribeModalClosable: action.payload.closable || false,
        subscribeModalType: action.payload.subscribeModalType || state.subscribeModalType,
      };

    case ActionType.SetShowGuide:
      return {
        ...state,
        showGuide: action.payload,
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
