import React, { useEffect, useRef } from 'react';
import styles from './index.module.scss';

export interface IHighLight {
  search_text?: string; // 回答中的高亮文本
  similar_text?: string; // 原文中的高亮文本
}
interface IProps {
  content?: string;
  highLight?: IHighLight[];
  color: {
    color: string;
    textColor: string;
    hoverColor: string;
  };
}

import HighlightKeyword from './HighlightKeyword';
import { IKeywordOption } from '@/utils/highLightKeyword';
import { domHighLight } from '@/utils/domHighLight';
import { splitTextRow } from '@/utils/common.util';

const GoalContent: React.FC<IProps> = ({ content = '', highLight = [], color }) => {
  const highlightNodes = useRef<any>({});

  useEffect(() => {
    const tempScrollY = window.scrollY; // 记录搜索之前页面的滚动位置，搜索完成之后回到这个位置
    console.log('~highLight:', highLight);
    if (Array.isArray(highLight)) {
      highLight?.forEach((h, i) => {
        highlightNodes.current[i] = [];
        // 换行的文本window.find无法找到，分割开来分别搜索
        // 换行符可能是 \r \n 或者多个组个，把\r全部替换为\n，再用\n分割、再把空字符串清除
        const similar_text = splitTextRow(h.similar_text);
        console.log('~similar_text:', similar_text);
        similar_text?.forEach((text) => {
          const sel = window.getSelection();
          sel?.collapse(document.body, 0);
          if (window.find(text)) {
            // 记录每个文本对应的高亮node，进行后续操作
            window.scrollTo(0, tempScrollY);
            const nodes = domHighLight(
              {
                color: color.color,
                // textColor: color.textColor,
              },
              sel,
            );
            highlightNodes.current[i] = [...highlightNodes.current[i], ...nodes];
          }
        });
      });
      // find会导致页面滚动，搜索完回到顶部
      // setTimeout(() => {
      //   window.scrollTo(0, 0);
      // }, 0);
    } else {
      console.error('highLight is not an array,highLight:', highLight);
    }
  }, [highLight]);

  const keywords = highLight?.map
    ? (highLight?.map((h, i) => ({
        keyword: h.search_text,
        renderHighlightKeyword: (content) => (
          <span
            onClick={() => {
              // 点击定位到对应的高亮node并改变颜色
              highlightNodes.current[i]?.[0]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              highlightNodes.current[i]?.forEach((element: HTMLElement) => {
                element.style.setProperty('background-color', color.hoverColor);
              });
            }}
            onMouseLeave={() => {
              // 鼠标移出恢复颜色
              highlightNodes.current[i]?.forEach((element: HTMLElement) => {
                element.style.setProperty('background-color', color.color);
              });
            }}
            className={styles.highlignt}>
            {content}
          </span>
        ),
      })) as IKeywordOption[])
    : [];

  return <HighlightKeyword content={content} keywords={keywords} />;
};

export default GoalContent;
