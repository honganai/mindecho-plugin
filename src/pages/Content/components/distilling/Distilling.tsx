import React, { useEffect, useRef, useState, useContext } from 'react';
import styles from './index.module.scss';
import { ConfigProvider, Modal } from 'antd';
import _ from 'lodash';
import Chat from '../chat/Chat';
import SubscribeModalContent from './SubscribeModalContent';
import useDistillBlock from '@/hooks/useDistillBlock';
import Guide from './Guide';
import FurtherQuestions from '../FurtherQuestions';
import CaptureContent from '../CaptureContent';
import GoalCard from '../GoalCard';
import MarkdownContent from '../MarkdownContent';
import GlobalContext, { ActionType } from '@/reducer/global';
import reqShowSummary from '@/utils/showSummary';
import { getDocument } from '@/utils/common.util';
import { UserInfo } from '@/types';
import { getExtensionUpdated } from '@/constants';

interface Props {
  userinfo: any;
  checkPay?: (callback: (userinfo: UserInfo) => void) => void;
}

const Distilling: React.FC<Props> = ({ userinfo, checkPay }: Props) => {
  const askFurtherQuestion = chrome.i18n.getMessage('askFurtherQuestion');
  const guessOnYourMind = chrome.i18n.getMessage('guessOnYourMind');
  const capturContentAndDistill = chrome.i18n.getMessage('capturContentAndDistill');

  const [chatMessage, setMessage] = useState({}); // 向chat传message
  const [extensionUpdate, setExtensionUpdate] = useState(false);

  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);

  const { articleId, conversationId, articleDistillId } = globalState;

  const { reciveEnd, furtherQuestions, captureContent, intentNote, restData, markdownStream } = useDistillBlock();

  /**
   * 选择段落同步到chat界面
   * @param paragraph
   */
  const onSelectParagraph = (paragraph: string) => {
    const msg = paragraph.replace(/^\d+\.\s/, '');
    // set chat msg
    setMessage({
      message: msg,
      conversation_id: conversationId,
      article_id: articleId,
    });
    // 记录用户重点关注的问题
    // chrome.runtime.sendMessage(
    //   {
    //     type: 'request',
    //     api: 'quesiton_merge_by_content',
    //     body: {
    //       article_distill_id: articleDistillId,
    //       article_id: articleId,
    //       question_content: msg,
    //       user_id: userinfo.id,
    //     },
    //   },
    //   (res) => {
    //     console.log(res);
    //   },
    // );
  };

  useEffect(() => {
    if (articleId) {
      chrome.runtime.sendMessage(
        {
          type: 'readingTime',
          data: {
            articleId,
            ua: navigator.userAgent,
          },
        },
        (res) => console.log(res),
      );
    }
  }, [articleId]);

  useEffect(() => {
    restData();
    chrome.runtime.sendMessage(
      {
        type: 'disconnect',
      },
      (res) => {
        console.log('关闭ws');
      },
    );
    // 已经弹出了重置对话框就不请求了
    if (!globalState.showSubscribeModal) {
      reqShowSummary(globalState.cleanArticle.content);
    }
  }, [globalState.language]);

  const contentRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef(null);

  useEffect(() => {
    // 引导相关dom用ref记录，变更不会触发react更新，异步渲染需要更新完成后触发一次
    globalDispatch({
      type: ActionType.SetShowGuide,
      payload: true,
    });
  }, [reciveEnd]);

  useEffect(() => {
    getExtensionUpdated().then((res: any) => {
      setExtensionUpdate(!!res);
    });
  }, []);
  return (
    <ConfigProvider>
      <div className={styles.container} ref={contentRef} id="pointread-plugin-distill">
        <div className={styles.wrap}>
          <MarkdownContent markdownStream={markdownStream} reciveEnd={reciveEnd}></MarkdownContent>
          {/* Goal */}
          {/* <div
            className={styles.paragraph}
            ref={(dom) => {
              if (dom) {
                globalState.guideRefs.current['goal'] = dom;
              }
            }}>
            <div className={styles['paragraph-title']}>{guessOnYourMind}</div>
            <GoalCard reciveEnd={reciveEnd} intentNote={intentNote} />
          </div> */}
          {/* Capture Content */}
          {/* <div
            className={styles.paragraph}
            ref={(dom) => {
              if (dom) {
                globalState.guideRefs.current['content'] = dom;
              }
            }}>
            <div className={styles['paragraph-title']}>{capturContentAndDistill}</div>
            <CaptureContent reciveEnd={reciveEnd} captureContent={captureContent} />
          </div> */}
          {/* Further Questions */}
          {/* <div
            className={styles.paragraph}
            ref={(dom) => {
              if (dom) {
                globalState.guideRefs.current['questions'] = dom;
              }
            }}>
            <div className={styles['paragraph-title']}>{askFurtherQuestion}</div>
            <FurtherQuestions
              reciveEnd={reciveEnd}
              furtherQuestions={furtherQuestions}
              onSelectParagraph={onSelectParagraph}
            />
          </div> */}
        </div>
        {/* {reciveEnd && (
          <div ref={chatRef}>
            <Chat
              conversationid={conversationId}
              contentRef={contentRef}
              userinfo={userinfo}
              message={chatMessage}></Chat>
          </div>
        )} */}

        <Modal
          width={340}
          style={{
            top: 60,
          }}
          closable={false}
          wrapClassName={styles['subscribe-modal-wrapper']}
          open={globalState.showSubscribeModal}
          mask={false}
          getContainer={() => getDocument().getElementById('pointread-plugin-distill') || document.body}
          footer={null}>
          <SubscribeModalContent
            userinfo={userinfo}
            onCancle={() => {
              const linkEl = getDocument().getElementById('pointread-sidebar');
              if (linkEl) linkEl.style.display = 'none';
              chrome.runtime.sendMessage({ type: 'close' }, (res) => {
                console.log('关闭完成', res);
              });
            }}
            onComplete={checkPay}
            onStart={() => {
              restData();
              reqShowSummary(globalState.cleanArticle.content);
              globalDispatch({
                type: ActionType.SetShowSubscribeModal,
                payload: false,
              });
            }}
          />
        </Modal>

        {extensionUpdate && reciveEnd && globalState.showGuide && <Guide contentRef={contentRef} />}
      </div>
    </ConfigProvider>
  );
};

export default Distilling;
