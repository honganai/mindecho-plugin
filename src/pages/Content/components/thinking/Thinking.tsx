import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExportOutlined } from '@ant-design/icons';
import { Props } from './interface';
import { THINKING_URL } from '@/constants';
import styles from './index.module.scss';
import _ from 'lodash';
import Unsorted from './components/unsorted';
import GoalView from './components/goal';
import ArticleList from './components/ArticleList';
import { useSize } from 'ahooks';

const Thinking: React.FC<Props> = ({ title, userinfo, thinkingKey }: Props) => {
  const [reload, setReload] = useState<any>(false);
  const gotoThinking = chrome.i18n.getMessage('gotoThinking');
  const containerRef = useRef(null);
  const headRef = useRef(null);

  const containerSize = useSize(containerRef);
  const headSize = useSize(headRef);

  const listHeight = useMemo(() => {
    return (containerSize?.height || 0) - (headSize?.height || 0);
  }, [headSize?.height, containerSize?.height]);

  useEffect(() => {
    setReload(!reload);
  }, [thinkingKey]);

  return (
    <div className={styles.container} ref={containerRef}>
      {/* <div className={styles['goto-thinking']} ref={headRef}>
        <div className={styles['goto-thinking__text']}>
          <span
            className={styles['goto-thinking__text_strong']}
            onClick={() => {
              window.open(THINKING_URL);
            }}>
            {gotoThinking}
            <ExportOutlined className={styles['goto-thinking__text_icon']} />
          </span>
        </div>
      </div> */}
      {/* <Unsorted /> */}
      {/* <GoalView /> */}
      <ArticleList listHeight={listHeight} />
    </div>
  );
};

export default Thinking;
