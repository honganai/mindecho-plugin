import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSize } from 'ahooks';
import styles from './index.module.scss';
import _ from 'lodash';
import { Typography, Spin, Empty } from 'antd';
import VirtualList from 'rc-virtual-list';
import { IArticleData } from './interface';
import ThinkingSearch from './search';
import { getArticleGroupPageSize } from './config';
import { CopyFilled, LinkOutlined } from '@ant-design/icons';
import { formatDateMMDD, copyToClipboard, getDocument } from '@/utils/common.util';

interface IProps {
  listHeight: number;
}

const ArticleList: React.FC<IProps> = ({ listHeight }) => {
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [articleList, setArticleList] = useState<IArticleData[]>([]);
  const noResultFoundText = chrome.i18n.getMessage('noResultFound') || 'No result found';
  const searchRef = useRef(null);
  const searchSize = useSize(searchRef);

  const appendData = () => {
    if (!hasMore || loading) {
      return false;
    }
    setLoading(true);
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'getArticleGroup',
        body: { page, pageSize: getArticleGroupPageSize, keywords: keyword },
        headers: {},
      },
      ({ result, total }) => {
        if (articleList.length + result.length >= total) {
          setHasMore(false);
        }
        setArticleList([...articleList, ...result.map((obj: IArticleData) => ({ ...obj, uuid: _.uniqueId() }))]);
        setPage(page + 1);
        setLoading(false);
      },
    );
  };

  const articleHeight = useMemo(() => {
    return listHeight - (searchSize?.height || 0);
  }, [listHeight, searchSize?.height]);

  useEffect(() => {
    appendData();
  }, []);

  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    console.log(
      '🚀 ~ file: index.tsx:60 ~ onScroll ~ e.currentTarget.scrollHeight - e.currentTarget.scrollTop:',
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop,
      articleHeight,
    );

    if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop - 100 <= articleHeight) {
      // -100 提前一点开始加载下一页
      appendData();
    }
  };

  const formatCopy = (item: IArticleData) => {
    const resultText = `${item.intent}\r\n${item.note}\r\n${item.article_title}\r\n${item.article_url}\r\n${item.article_distill_time}\r\n`;
    copyToClipboard(resultText);
  };

  /**
   * @description: 搜索组件的搜索方法
   * @param {string} _keyword 搜索关键字
   * @param {boolean} _hasMore 是否还有更多页
   * @param {boolean} _articleList 搜索返回的结果数据
   * @return {*}
   */
  const searchCallback = (_keyword: string, _hasMore: boolean, _articleList: IArticleData[]) => {
    setPage(1);
    setKeyword(_keyword);
    setHasMore(_hasMore);
    setArticleList(_articleList);
  };

  return (
    <div className={styles.container}>
      <div ref={searchRef}>
        <ThinkingSearch onSearch={searchCallback} />
      </div>
      {(!_.isArray(articleList) || articleList.length === 0) && !loading && (
        <div className="thinking-no-data-wrapper">
          <Empty description={noResultFoundText} />
        </div>
      )}
      <VirtualList
        data={articleList}
        height={articleHeight}
        itemKey="uuid"
        onScroll={onScroll}
        extraRender={() => hasMore && <Spin style={{ marginTop: 20 }} spinning={true} />}>
        {(item: IArticleData) => (
          <div className={styles['content-wrapper']}>
            <div className={styles['title-wrapper-active']}>
              <div className={styles['title']} dangerouslySetInnerHTML={{ __html: item.html_intent || item.intent }} />
              <CopyFilled
                className={styles['copy-icon']}
                onClick={(e) => {
                  e.stopPropagation();
                  formatCopy(item);
                }}
              />
            </div>
            <div className={styles['article-item']}>
              <div className={styles['summary']} dangerouslySetInnerHTML={{ __html: item.html_note || item.note }} />
              <div
                className={styles['item-title-wrapper']}
                onClick={() => {
                  window.open(item.article_url);
                }}>
                <div className={styles['item-wrapper']}>
                  <LinkOutlined
                    className={styles['link-icon']}
                    onClick={() => {
                      window.open(item.article_url);
                    }}
                  />
                  <Typography.Text
                    className={styles['item-title-text']}
                    ellipsis={{
                      tooltip: {
                        title: item.article_title,
                        zIndex: 21474836471,
                        getPopupContainer: () => getDocument().getElementById('pointread-sidebar') as HTMLElement,
                      },
                    }}>
                    <div dangerouslySetInnerHTML={{ __html: item.html_article_title || item.article_title }} />
                  </Typography.Text>
                </div>
                <div className={styles['item-wrapper']}>
                  <div className={styles.date}>{formatDateMMDD(item.article_distill_time)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </VirtualList>
    </div>
  );
};

export default ArticleList;
