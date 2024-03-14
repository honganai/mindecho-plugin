import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from 'antd';
import _ from 'lodash';
import { SearchOutlined, LoadingOutlined, CloseCircleFilled } from '@ant-design/icons';
import styles from './search.module.scss';
import { IArticleData } from './interface';
import { getArticleGroupPageSize } from './config';

interface OnSearch {
  (keyword: string, hasMore: boolean, articleList: IArticleData[]): void;
}

interface Props {
  onSearch: OnSearch;
}

const ThinkingSearch: React.FC<Props> = ({ onSearch }) => {
  const [loading, setLoading] = useState(false);

  /** 请求搜索结果 */
  const thinkingRequest = (keyword: string) => {
    setLoading(true);
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'getArticleGroup',
        body: { page: 1, pageSize: getArticleGroupPageSize, keywords: keyword },
        headers: {},
      },
      ({ result, total }) => {
        if (result) {
          let _hasMore = true;
          let articleList = [] as IArticleData[];

          if (articleList.length + result.length >= total) {
            _hasMore = false;
          }
          articleList = result.map((obj: IArticleData) => {
            const { article_title, intent, note, ...other } = obj;
            return {
              article_title,
              html_article_title: formatSearchHighlight(article_title, keyword),
              intent,
              html_intent: formatSearchHighlight(intent, keyword),
              note,
              html_note: formatSearchHighlight(note, keyword),
              ...other,
              uuid: _.uniqueId(),
            };
          });

          console.log('search', articleList);
          onSearch(keyword, _hasMore, articleList);
        }
        setLoading(false);
      },
    );
  };

  /** 处理文本 highlight */
  const formatSearchHighlight = (text: string, keyword: string): string => {
    // 搜索关键字为空则不处理
    if (keyword === '') return text;
    const reg = new RegExp(`(${keyword})`, 'gi');
    return text.replace(reg, '<span class="search-keyword-highlight">$1</span>');
  };

  /** 搜索框回车事件 */
  const handleThinkingSearch = (e: any) => {
    const { value: keyword } = e.target;
    thinkingRequest(keyword);
  };

  /** 模拟清空按钮 */
  const handleClear = () => {
    thinkingRequest('');
  };
  return (
    <div className={styles.container}>
      <div className="search-wrapper">
        <div className="search-input">
          <Input
            placeholder="Search in notes"
            allowClear={{ clearIcon: <CloseCircleFilled style={{ color: '#fff' }} onClick={handleClear} /> }}
            disabled={loading}
            prefix={
              loading ? <LoadingOutlined style={{ color: '#fff' }} /> : <SearchOutlined style={{ color: '#fff' }} />
            }
            bordered={false}
            onPressEnter={handleThinkingSearch}
          />
        </div>

        {/* <div className="search-date"></div> */}
      </div>
    </div>
  );
};

export default ThinkingSearch;
