import React from 'react';

export interface IState {
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
  /** 引导相关的dom */
  guideRefs: React.MutableRefObject<Record<string, HTMLElement>>;
  showGuide: boolean;
}

export enum ActionType {
  /** 设置当前语言 */
  SetLanguage = 'SET_LANGUAGE',
  SetConversationId = 'SET_CONVERSATIOM_ID',
  SetArticleId = 'SET_ARTICLE_ID',
  SetArticleDistillId = 'SET_ARTICLE_DISTILL_ID',
  SetShowSubscribeModal = 'SET_SHOW_SUBSCRIBE_MODAL',
  SetShowGuide = 'SET_SHOW_GUIDE',
}

export type IAction =
  | ISetLanguageAction
  | ISetConversationIdAction
  | ISetArticleIdAction
  | ISetArticleDistillIdAction
  | ISetShowSubscribeModal
  | ISetShowGuide;

export interface ISetShowGuide {
  type: ActionType.SetShowGuide;
  payload: boolean;
}
export interface ISetShowSubscribeModal {
  type: ActionType.SetShowSubscribeModal;
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
        showSubscribeModal: action.payload,
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
