import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CopyOutlined } from '@ant-design/icons';

import styles from './index.module.scss';
import { message, Skeleton } from 'antd';
import GlobalContext from '@/reducer/global';
import GoalContent, { IHighLight } from '../GoalCard/GoalContent';
import { HEIGHTLIGHT_COLORS as COLORS } from '@/constants';
import CopyIcon from '@/assets/icons/copy.svg';

interface IProps {
  captureContent?: Record<string, string>[];
  reciveEnd: boolean;
}

const colorIndex = 2;

const formatI18nTitle = (text: string) => {
  text = text.replace(/[<|>_]/g, '').replace(/[^A-z]/g, '');
  return text.slice(0, 1).toLowerCase() + text.slice(1);
};

const CaptureContent: React.FC<IProps> = ({ captureContent = [], reciveEnd }) => {
  const { state: globalState } = useContext(GlobalContext);
  const { content } = globalState.cleanArticle;

  const copiedI18N = chrome.i18n.getMessage('copied');
  const [highLight, setHighLight] = useState<Record<string, IHighLight[]>>({
    key_logics: [],
    quotes: [],
    data_sheet: [],
  });

  const keyLogicsText = useMemo(() => {
    const obj = captureContent?.filter((data) => Object.keys(data)[0] == 'key_logics')?.[0];
    return obj?.['key_logics'];
  }, [captureContent]);

  const quotesText = useMemo(() => {
    const obj = captureContent?.filter((data) => Object.keys(data)[0] == 'quotes')?.[0];
    return obj?.['quotes'];
  }, [captureContent]);

  const dataSheetText = useMemo(() => {
    const obj = captureContent?.filter((data) => Object.keys(data)[0] == 'data_sheet')?.[0];
    return obj?.['data_sheet'];
  }, [captureContent]);

  // 请求高亮接口
  const requestHighLight = (text: string, callback: (res: IHighLight[]) => void) => {
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'highlightText',
        body: {
          article_content: content,
          search_text: text,
          url: window.location.href,
        },
        headers: {},
      },
      (res) => {
        callback?.(res);
      },
    );
  };

  useEffect(() => {
    if (keyLogicsText) {
      requestHighLight(keyLogicsText, (res) => {
        setHighLight((pre) => {
          return {
            ...pre,
            key_logics: res || [],
          };
        });
      });
    }
  }, [keyLogicsText]);

  useEffect(() => {
    if (dataSheetText) {
      requestHighLight(dataSheetText, (res) => {
        setHighLight((pre) => {
          return {
            ...pre,
            data_sheet: res || [],
          };
        });
      });
    }
  }, [dataSheetText]);

  useEffect(() => {
    if (quotesText) {
      requestHighLight(quotesText, (res) => {
        setHighLight((pre) => {
          return {
            ...pre,
            quotes: res || [],
          };
        });
      });
    }
  }, [quotesText]);

  return captureContent && captureContent.length > 0 ? (
    captureContent.map((ele) => {
      const key = Object.keys(ele)[0];
      const i18nTitle = chrome.i18n.getMessage(formatI18nTitle(key));
      return (
        ele[key] && (
          <div
            className={styles.content}
            key={key}
            ref={(dom) => {
              if (dom) {
                globalState.guideRefs.current[key] = dom;
              }
            }}>
            <div className={styles.title}>{i18nTitle}</div>
            <div
              className={styles.copy}
              onClick={() => {
                navigator.clipboard.writeText([i18nTitle, ele[key]].join('\r\n')).then(() => {
                  message.success(copiedI18N);
                });
              }}>
              <CopyIcon />
            </div>
            <div className={styles['text-p']}>
              {['key_logics', 'data_sheet', 'quotes'].indexOf(key) > -1 ? (
                <GoalContent
                  color={{
                    color: COLORS[colorIndex].body.back,
                    textColor: COLORS[colorIndex].body.text,
                    hoverColor: COLORS[colorIndex].head.back,
                  }}
                  content={ele[key]}
                  highLight={highLight[key]}
                />
              ) : (
                ele[key]
              )}
            </div>
          </div>
        )
      );
    })
  ) : !reciveEnd ? (
    <Skeleton title={false} active />
  ) : null;
};

export default CaptureContent;
