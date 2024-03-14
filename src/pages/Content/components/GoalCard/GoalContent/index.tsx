import React, { useEffect, useRef } from 'react';
import styles from './index.module.scss';

export interface IHighLight {
  search_text?: string; // 回答中的高亮文本
  similar_text?: string; // 原文中的高亮文本
  similar_text_context?: string[];
}
interface IProps {
  content?: string;
  highLight?: IHighLight[];
  color: IColor;
  onUpdate?: (v: IHighLight) => void;
}

interface IColor {
  color: string;
  textColor: string;
  hoverColor: string;
}

import HighlightKeyword from './HighlightKeyword';
import { IKeywordOption } from '@/utils/highLightKeyword';
import { domHighLight } from '@/utils/domHighLight';
import { splitTextRow } from '@/utils/common.util';
import { HIGHLIGHT_NEXT_LENGTH } from '@/constants';

const GoalContent: React.FC<IProps> = ({ content = '', highLight = [], color, onUpdate }) => {
  const highlightNodes = useRef<any>({});

  useEffect(() => {
    const tempScrollY = window.scrollY; // 记录搜索之前页面的滚动位置，搜索完成之后回到这个位置
    console.log('~highLight:', highLight);
    if (Array.isArray(highLight)) {
      highLight?.forEach((h, i) => {
        if (highlightNodes.current[i]) {
          // 避免重复执行
          return false;
        }
        highlightNodes.current[i] = [];
        // 换行的文本window.find无法找到，分割开来分别搜索
        // 换行符可能是 \r \n 或者多个组个，把\r全部替换为\n，再用\n分割、再把空字符串清除
        const similar_text = splitTextRow(h.similar_text);
        console.log('~similar_text:', similar_text);
        similar_text?.forEach((text) => {
          const { nodes, texts } = highLightDom(text, tempScrollY, color);
          console.log('~block similar_text:', texts);
          if (texts && texts.length > 0) {
            onUpdate?.({
              ...h,
              similar_text_context: texts,
            });
          }

          highlightNodes.current[i] = [...highlightNodes.current[i], ...nodes];
        });
      });
    } else {
      console.error('highLight is not an array,highLight:', highLight);
    }
  }, [highLight]);

  const keywords = highLight?.map
    ? (highLight?.map((h, i) => ({
        keyword: h.search_text,
        renderHighlightKeyword: (content) => (
          <div
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
            className={styles.highlight}>
            {content}
          </div>
        ),
      })) as IKeywordOption[])
    : [];

  return <HighlightKeyword content={content} keywords={keywords} />;
};

export default GoalContent;

function getBlockText(container: any): any {
  try {
    // Sometimes the element will only be text. Get the parent in that case
    while (!container.innerHTML) {
      container = container.parentNode;
    }

    if (window.getComputedStyle(container).display !== 'none') {
      return container;
    } else {
      return container.parentElement ? getBlockText(container.parentElement) : false;
    }
  } catch {
    return false;
  }
}

function highLightDom(text: string, tempScrollY: number, color: IColor, getNext = true): any {
  const sel = window.getSelection();
  sel?.collapse(document.body, 0);
  if (window.find(text)) {
    // 记录每个文本对应的高亮node，进行后续操作
    window.scrollTo(0, tempScrollY);
    // 将本文所在段落高亮
    const container = sel?.getRangeAt(0).commonAncestorContainer;
    const blockContainer = getBlockText(container);
    const blockText = splitTextRow(blockContainer.innerText);
    let nextNodes = [];
    let nextTexts = [];
    if ( blockText && blockText.length === 1 && getTextLength(blockContainer.innerText) ) {
      sel?.collapse(document.body, 0);
      window.find(blockText[0]);
      window.scrollTo(0, tempScrollY);
    }
    const nodes = domHighLight(
      {
        color: color.color,
        // textColor: color.textColor,
      },
      sel,
    );

    // 不足50字下一段文本也加入其中
    if (getNext && blockText[0] && blockText[0].length < HIGHLIGHT_NEXT_LENGTH  && getTextLength(blockContainer.innerText) ) {
      const nextContainer = getNextSibling(blockContainer);
      if (nextContainer && nextContainer.innerText) {
        const { nodes: nNodes, texts: nTexts } = highLightDom(
          splitTextRow(nextContainer.innerText)[0],
          tempScrollY,
          color,
          (getNext = false),
        );
        nextNodes = nNodes;
        nextTexts = nTexts;
      }
    }

    return {
      nodes: [...nodes, ...nextNodes],
      texts: [ blockContainer.innerText.length < 500 ? blockText[0] : text, ...nextTexts],
    };
  } else {
    return {
      nodes: [],
      texts: [],
    };
  }
}

function getTextLength(text: string): boolean {
  const HIGHLIGHT_NEXT_LENGTH = 1200;
  const count = text.length;
  const chineseCount = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const englishCount = count - chineseCount;
  return chineseCount * 3 + englishCount < HIGHLIGHT_NEXT_LENGTH;
}

function getNextSibling(current: any): any {
  try {
    let nextSibling = null;
    // Sometimes the element will only be text. Get the parent in that case
    while (!nextSibling || nextSibling.childNodes.length === 0) {
      nextSibling = current.nextSibling;
      current = current.parentNode;
    }

    if (splitTextRow(nextSibling.innerText).length > 0) {
      return nextSibling;
    } else {
      return nextSibling.nextSibling ? getNextSibling(nextSibling) : false;
    }
  } catch {
    return false;
  }
}
