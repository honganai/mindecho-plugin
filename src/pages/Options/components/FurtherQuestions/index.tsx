import React, { useMemo } from 'react';

import styles from './index.module.scss';
import { splitTextRow } from '@/utils/common.util';
import { Skeleton } from 'antd';

interface IProps {
  furtherQuestions?: Record<string, string>;
  onSelectParagraph: (text: string) => void;
  reciveEnd: boolean;
}

const FurtherQuestions: React.FC<IProps> = ({ furtherQuestions, onSelectParagraph, reciveEnd }) => {
  if (!furtherQuestions) {
    return !reciveEnd ? <Skeleton title={false} active /> : null;
  }

  const key = Object.keys(furtherQuestions)?.[0];
  const value = furtherQuestions[key];

  const splitValue = useMemo(() => {
    // return splitTextRow(value);
    // 后端反馈可能没有换行符，这里按?分割
    return value
      .split(/\?|\uFF1F/)
      .map((s) => s.trim())
      .filter((s) => !!s)
      .map((s) => `${s}?`);
  }, [value]);

  return (
    <div className={styles.container}>
      {splitValue.map((item) => {
        return (
          <div key={item} className={styles['question-item']}>
            <div className={styles['question-item-text']} onClick={() => onSelectParagraph(item)}>
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FurtherQuestions;
