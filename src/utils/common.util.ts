import dayjs from 'dayjs';
import { message } from 'antd';
import { ThinkingCopyObject } from '@/types';
import {useEffect, useRef} from 'react';

/**
 * @description: 格式化时间为 MM/DD
 * @param {string} dateString 时间字符串
 * @return {*}
 */
export const formatDateMMDD = (dateString: string, returnDefault = true) => {
  if (!dateString && returnDefault) return '--/--';
  return dayjs(dateString).format('MM/DD');
};

/**
 * @description: 复制到剪切板
 * @param {string} copyText
 * @return {*}
 */
export const copyToClipboard = (copyText: string) => {
  const copiedI18N = chrome.i18n.getMessage('copied');
  navigator.clipboard.writeText(copyText).then(() => {
    message.success(copiedI18N);
  });
};

/**
 * @description: 使用 chrome api 检测接口
 * @param {string} text
 * @return {*}
 */
export const chromeDetectLanguage = async (text: string) => {
  if (!text) return '';
  const result = await chrome.i18n.detectLanguage(text);
  if (result.languages.length > 0) return result.languages[0].language;
  return '';
};

/**
 * 获取shadowRoot，之前对插件的所有document操作都要换成这个
 */
export const getDocument = () => {
  return document.getElementById('mindecho-extension-shadow')?.shadowRoot || document;
};

/**
 * 换行符可能是 \r \n 或者多个组个，把\r全部替换为\n，再用\n分割、再把空字符串清除 */
export const splitTextRow = (text?: string) => {
  return (
    text
      ?.replace(/\r/g, '\n')
      ?.split('\n')
      .filter((t: string) => t.length >= 13)
      .filter((t: string) => !!t) || []
  );
};


export const SetInterval = (callback: Function, delay: number = 1000) => {
  const Ref = useRef<any>();

  Ref.current = () => {
    return callback();
  }
  useEffect(() => {
    const timer = setInterval(() => {
      Ref.current();
    }, delay);
    return () => {
      clearInterval(timer);
    }
  }, [delay]);
}

export const truncateTitle = (title:string, limitEnglish = 20, limitChinese = 10) => {
  title = title.trim();
  if (!title) return 'No data available';

  // 判断字符串是否含有中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(title);
  const limit = hasChinese ? limitChinese : limitEnglish;

  // 根据字符类型截取
  if (hasChinese) {
    // 中文字符串，按字符数截取
    return title.length > limit ? title.slice(0, limit) + '...' : title;
  } else {
    // 英文字符串，按单词数截取
    const words = title.split(' ');
    if (words.length > limit) {
      return words.slice(0, limit).join(' ') + '...';
    } else {
      return title;
    }
  }
};
