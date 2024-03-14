import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import { LinkOutlined, CopyOutlined } from '@ant-design/icons';
import VirtualList from 'rc-virtual-list';
import { List, Typography, message } from 'antd';
import _ from 'lodash';
import { UnsortGroup } from '@/types';
import { formatDateMMDD, copyToClipboard } from '@/utils/common.util';

const Unsorted: React.FC = () => {
  const [isShowUnsortedContent, setIsShowUnsortedContent] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [unsortGroupList, setUnsortGroupList] = useState([] as UnsortGroup[]);
  const [unsortGroupTotal, setUnsortGroupTotal] = useState(0);
  const pageSize = 10;
  const ContainerHeight = 800;

  const [messageApi, contextHolder] = message.useMessage();

  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    if (unsortGroupList.length >= unsortGroupTotal) {
      return;
    }
    if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === ContainerHeight) {
      appendDataWithThrottle();
    }
  };

  useEffect(() => {
    appendDataWithThrottle();
  }, []);
  const appendData = () => {
    console.log('getUnsortGroup');
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'getUnsortGroup',
        params: { page, pageSize },
        headers: {},
      },
      ({ result, total }) => {
        if (!result) {
          return;
        }
        console.log('getUnsortGroup result', result);
        try {
          setUnsortGroupList([...unsortGroupList, ...result]);
          setUnsortGroupTotal(total);
          setPage(page + 1);
        } catch (err) {
          console.log(err);
        }
      },
    );
  };
  const appendDataWithThrottle = _.throttle(appendData, 1000);

  const openUrlInNewTab = (url: string) => {
    window.open(url);
  };

  const formatCopy = (item: UnsortGroup) => {
    const { title, url, changed_on, summary_content } = item;
    const changedOn = formatDateMMDD(changed_on);
    const resultText = `${summary_content}\r\n${title}\r\n${url}\r\n${changedOn}`;
    copyToClipboard(resultText);
  };

  return unsortGroupTotal <= 0 ? (
    ''
  ) : (
    <div className={styles.container}>
      <div
        className={styles[`unsorted-title${isShowUnsortedContent ? '-active' : ''}`]}
        onClick={() => {
          setIsShowUnsortedContent(!isShowUnsortedContent);
        }}>
        <div className={styles['unsorted-title-text']}>Unsorted</div>
      </div>
      {isShowUnsortedContent && (
        <List>
          <VirtualList
            className={styles['rc-virtual-list-scrllbar-style']}
            data={unsortGroupList}
            onScroll={onScroll}
            /* height={ContainerHeight} 暂时隐藏掉 翻页使用loadmore*/
            itemKey="id">
            {(item: UnsortGroup) => (
              <div key={item.id + ''} className={styles['unsorted-content']}>
                <div className={styles['unsorted-content-summary']}>{item.summary_content}</div>
                <div
                  className={styles['unsorted-content-title-wrapper']}
                  onClick={() => {
                    openUrlInNewTab(item.url);
                  }}>
                  <div className={styles['unsorted-content-item-wrapper']}>
                    {contextHolder}
                    <LinkOutlined className={styles['unsorted-content-title-prefix-icon']} />
                    <Typography.Text
                      className={styles['unsorted-content-title-text']}
                      ellipsis={{
                        tooltip: {
                          title: item.title,
                          zIndex: 21474836471,
                        },
                      }}>
                      {item.title}
                    </Typography.Text>
                  </div>
                  <div className={styles['unsorted-content-item-wrapper']}>
                    <CopyOutlined
                      className={styles['unsorted-content-title-suffix-icon']}
                      onClick={(e) => {
                        e.stopPropagation();
                        formatCopy(item);
                      }}
                    />
                    <div className={styles['unsorted-content-title-time']}>{formatDateMMDD(item.changed_on)}</div>
                  </div>
                </div>
              </div>
            )}
          </VirtualList>
        </List>
      )}
    </div>
  );
};
export default Unsorted;
