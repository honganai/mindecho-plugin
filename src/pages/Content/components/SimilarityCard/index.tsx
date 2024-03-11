import React from 'react';
import { Highlight } from '../../../../types';
import { Tooltip, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

import styles from './index.module.scss';

function getTimeAgo(timeString: string) {
  const timestamp = Date.parse(timeString);
  const now = new Date().getTime();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return timeString;
  } else if (days > 7) {
    return `${days} days ago`;
  } else if (hours >= 24) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (minutes >= 60) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (seconds >= 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
}

interface IProps {
  items: any;
  itemType: any;
}

const SimilarityCard: React.FC<IProps> = ({ items, itemType }) => {
  const similarContentRead = chrome.i18n.getMessage('similarContentRead');
  const couldBeRelevant = chrome.i18n.getMessage('couldBeRelevant');

  return items.map((item: Highlight, index: number) => {
    return itemType === '<Further Questions>' ? (
      <div key={index} className={styles['similarity-card']}>
        {item.article && (
          <div className={styles['similarity-card-article']}>
            <div className={styles['similarity-card-article-title']}>{item.keypoint}</div>
            <div className={styles['similarity-card-article-content']}>
              <a
                className={styles['similarity-card-article-link']}
                href={item.article.url}
                target="_blank"
                rel="noreferrer">
                <LinkOutlined />
                <span className={styles.title}>{item.article.title}</span>
              </a>
              <span className={styles['similarity-card-article-time']}>{couldBeRelevant}</span>
            </div>
          </div>
        )}
      </div>
    ) : (
      item?.article?.changed_on && (
        <div className={styles['similarity-time']}>
          {similarContentRead} {getTimeAgo(item?.article?.changed_on)}
        </div>
      )
    );
  });
};

export default SimilarityCard;
