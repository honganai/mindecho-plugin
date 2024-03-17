import React from 'react';

/** 弹窗类型 */
export enum enumSubscribeModalType {
  Premium,
  Elite,
}

export interface IState {
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
  SetShowAskModal = 'SetShowAskModal',
  SetLanguage = 'SET_LANGUAGE',
  SetShowAnswerModal = 'SetShowAnswerModal',
  SetQuestion = 'SetQuestion',
  SetIsRequesting = 'SetIsRequesting',
  SetRequestEnd = 'SetRequestEnd',
  SetMarkdownStream = 'SetMarkdownStream',
}

export type IAction =
  | ISetShowAskModal
  | ISetLanguageAction
  | ISetShowAnswerModal
  | ISetQuestion
  | ISetIsRequesting
  | ISetRequestEnd
  | ISetMarkdownStream;

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
