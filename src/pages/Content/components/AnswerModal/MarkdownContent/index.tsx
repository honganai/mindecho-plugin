import React, { useEffect, useState, memo, useContext } from 'react';
import markdownit from 'markdown-it';
import styles from './index.module.scss';
import parse, { HTMLReactParserOptions, domToReact } from 'html-react-parser';
import { ReloadOutlined, CopyOutlined, FileDoneOutlined } from '@ant-design/icons';
import { message } from 'antd';
import clsx from 'clsx';
import PaymentForm, { PayReason, UserLevel } from './PaymentForm';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import { IProcessStatus } from '@/pages/Options/pages/manageSources';

interface IProps {
  markdownStream?: string;
  refresh: Function;
}

const md = markdownit({
  breaks: true // \n换行
});

// a标签打开新tab
// Remember the old renderer if overridden, or proxy to the default renderer.
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Add a new `target` attribute, or replace the value of the existing one.
  tokens[idx].attrSet('target', '_blank');

  // Pass the token to the default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

interface IContent {
  title: string;
  content: string;
  highLight?: [];
  html: string;
}

export const ASK_COUNT_LOCAL = 'askCountFormLocal';
export const MAX_ASK_COUNT = 3;
export const MAX_URL_COUNT = 0;

const fetchProgress: () => Promise<IProcessStatus[]> = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      resolve(res)
    })
  })
};

const MarkdownContent: React.FC<IProps> = ({ markdownStream = '', refresh }) => {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { userInfo } = globalState;

  const [data, setData] = useState<IContent[]>([]);
  const [copyStatus, setCopyStatus] = useState(false);
  const { getMessage: t } = chrome.i18n;
  const copyFailedI18N = t('copyFailed');
  const copySuccessI18N = t('copySuccess');
  const copyNotSupportedI18N = t('copyNotSupported');
  const [askCount, setAskCount] = useState(0);
  const [isAskLimit, setIsAskLimit] = useState(true);
  const [urlCount, setUrlCount] = useState(0);
  const [isUrlCountLimit, setIsUrlCountLimit] = useState(true);
  const parseMd = (mdStr: string) => {
    const container = document.createElement('div');
    container.innerHTML = md.render(mdStr); // 先把md转成html

    const contents: IContent[] = []; // 段落数组

    let tempData = {
      title: '',
      content: '',
      html: '',
    };
    container.childNodes.forEach((node) => {
      // 每个h3作为一个段落
      if (node.nodeName === 'H3') {
        const title = node.textContent || '';

        // 创建一个新段落
        tempData = {
          title,
          content: '',
          html: '',
        };
        contents.push(tempData);
      } else {
        tempData.content += node.textContent;
      }

      if ((node as Element).outerHTML) {
        tempData.html += (node as Element).outerHTML;
      }
    });
    return contents;
  };

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'request', api: 'userinfo' }
    );

    chrome.storage.sync.get([ASK_COUNT_LOCAL], (res) => {
      console.log("🚀 ~ chrome.storage.sync.get ~ res:", res)
      setAskCount(res[ASK_COUNT_LOCAL] || 0);
    })

    fetchProgress().then((res) => {
      const count = res.reduce((acc, curr) => acc + curr.count, 0);
      setUrlCount(count);
    })
  }, [])

  useEffect(() => {
    setData(parseMd(markdownStream));
  }, [markdownStream]);

  const copyText = () => {
    if (navigator?.clipboard) {
      setCopyStatus(true);
      setTimeout(() => {
        setCopyStatus(false);
      }, 3000)
      navigator.clipboard.writeText(data[0]?.content || copyFailedI18N);
      message.success(copySuccessI18N);
    } else {
      message.error(copyNotSupportedI18N);
    }
  }

  const closeModal = () => {
    globalDispatch({
      type: GlobalActionType.SetShowAnswerModal,
      payload: false,
    });
    globalDispatch({
      type: GlobalActionType.SetShowAskModal,
      payload: false,
    });
  }

  useEffect(() => {
    console.log("🚀 ~ userInfo?.subscription.mem_type:", userInfo?.subscription.mem_type)
    setIsAskLimit(askCount >= MAX_ASK_COUNT && userInfo?.subscription.mem_type === UserLevel.Free);
    setIsUrlCountLimit(urlCount >= MAX_URL_COUNT && userInfo?.subscription.mem_type === UserLevel.Free);
  }, [askCount, urlCount, userInfo?.subscription.mem_type,])

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index} className={clsx(
            styles.content,
          )}>
            <div className={styles.controls}>
              <ReloadOutlined onClick={() => refresh()} />
              {
                copyStatus ? <FileDoneOutlined /> : <CopyOutlined onClick={copyText} />
              }
            </div>

            <div className={
              clsx(
                styles['text-p'],
                isAskLimit ? `max-h-28 min-h-24 overflow-hidden relative` : '',
              )
            }>
              {isAskLimit && <div className="h-full w-full absolute top-0 left-0 overflow-hidden bg-gradient-to-t from-white z-10" />}
              {parse(item.html)}
            </div>

            {
              isAskLimit &&
              <div className={clsx(
                styles['limit-container'],
                'px-4'
              )}>
                <PaymentForm payReason={PayReason.OverAsk} />
              </div>
            }
          </div>
        );
      })}

      {
        isUrlCountLimit &&
        <div
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          className=" flex items-center justify-center w-full f-full fixed top-0 left-0 right-0 bottom-0 z-50"
          onClick={e => e.target === e.currentTarget && closeModal()}
        >
          <div className="max-w-[860px]">
            <PaymentForm payReason={PayReason.OverUrl} />
          </div>
        </div>
      }
    </>
  );
};

export default memo(MarkdownContent);
