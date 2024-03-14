import React, { useEffect, useState } from 'react';

import styles from './index.module.scss';
import Block from './components/block/block';
// import { AnyKindOfDictionary } from 'lodash';

interface Props {
  title?: string;
  userinfo: any;
}
const History: React.FC<Props> = ({ title, userinfo }: Props) => {
  const source = chrome.i18n.getMessage('source');
  const [distillList, setDistillList] = useState<any>([]);

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

  useEffect(() => {
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'article-distill-[list]',
        params: {
          q: {
            filters: [
              {
                col: 'user_id',
                opr: 'eq',
                value: userinfo.id,
              },
            ],
            keys: ['list_columns'],
            order_column: 'created_on',
            order_direction: 'desc',
            page: 0,
            page_size: 0,
          },
        },
        headers: {},
      },
      ({ result }) => {
        if (!result) {
          return;
        }
        try {
          const list = [];
          for (const i in result || []) {
            const item = result[i];
            const distill_content = JSON.parse(item.distill_content);
            list.push({ ...item, distill_content });
          }
          setDistillList(list);
          console.log(distillList);
        } catch (err) {
          console.log(err);
        }
      },
    );
  }, []);

  return (
    <div className={styles.container}>
      {distillList.map((item: any, index: any) => (
        <div className="paragraph" key={index}>
          <Block text={item.summary_content} title={item.article.title} />
          <div className="source">
            <span>
              <a href={item.article.url} target="_blank" rel="noopener noreferrer">
                {source}
              </a>
            </span>
            <span>{getTimeAgo(item.article.created_on)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default History;
