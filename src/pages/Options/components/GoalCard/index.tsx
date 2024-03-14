import React, { useContext, useEffect, useRef, useState } from 'react';
import { Goal } from '@/types';
import _ from 'lodash';
import { Skeleton, message } from 'antd';
import { CopyFilled } from '@ant-design/icons';

import styles from './index.module.scss';
import GlobalContext from '@/reducer/global';
import GoalContent, { IHighLight } from './GoalContent';
import { HEIGHTLIGHT_COLORS as COLORS } from '@/constants';
interface IProps {
  intentNote?: Record<string, string>;
  reciveEnd: boolean;
}

const index = 2;

const GoalCard: React.FC<IProps> = ({ intentNote, reciveEnd }) => {
  if (!intentNote) {
    return <Skeleton title={false} active />;
  }
  const copiedI18N = chrome.i18n.getMessage('copied');
  const [highLight, setHighLight] = useState<IHighLight[]>([]);
  const { state: globalState } = useContext(GlobalContext);
  const { content } = globalState.cleanArticle;

  useEffect(() => {
    if (intentNote.note) {
      chrome.runtime.sendMessage(
        {
          type: 'request',
          api: 'highlightText',
          body: {
            article_content: content,
            search_text: intentNote.note,
            url: window.location.href,
          },
          headers: {},
        },
        (res) => {
          setHighLight(res || []);
        },
      );
    }
  }, [intentNote.note]);

  // 保存user、article、goal的关系
  // useEffect(() => {
  //   if (articleId && updateGoalRelArticle.current) {
  //     updateGoalRelArticle.current = false; // 避免goal一直更新重复触发。只在获取到summary之后更新一次
  //     goal.forEach((g) => {
  //       g.summary &&
  //         chrome.runtime.sendMessage(
  //           {
  //             type: 'request',
  //             api: 'postUserGoalRelArticle',
  //             body: {
  //               user_id: g.user_id,
  //               status: 2,
  //               article_id: articleId,
  //               goal_id: g.goal_id,
  //               summary_by_goal: g.summary,
  //             },
  //             headers: {},
  //           },
  //           ({ result }) => {
  //             // do nothing
  //           },
  //         );
  //     });
  //   }
  // }, [articleId, goal]);

  const coremsg = intentNote.coremsg || intentNote.intent;

  return coremsg || intentNote.note ? (
    <div className={styles.goal}>
      <div
        className={styles.title}
        style={{
          backgroundColor: COLORS[index].head.back,
          color: COLORS[index].head.text,
          borderColor: COLORS[index].head.back,
        }}>
        {coremsg}
      </div>
      <div
        className={styles.content}
        style={{
          backgroundColor: COLORS[index].body.back,
          color: COLORS[index].body.text,
        }}>
        {intentNote.note ? (
          <GoalContent
            color={{
              color: COLORS[index].body.back,
              textColor: COLORS[index].body.text,
              hoverColor: COLORS[index].head.back,
            }}
            content={intentNote.note}
            highLight={highLight}
          />
        ) : !reciveEnd ? (
          <Skeleton title={false} active />
        ) : null}
      </div>
      {intentNote.note && (
        <div className={styles.copy}>
          <CopyFilled
            onClick={() => {
              const copyText = `${coremsg}\r\n${intentNote.note}`;
              navigator.clipboard.writeText(copyText).then(() => {
                message.success(copiedI18N);
              });
            }}
          />
        </div>
      )}
    </div>
  ) : !reciveEnd ? (
    <Skeleton title={false} active />
  ) : null;
};

export default GoalCard;
