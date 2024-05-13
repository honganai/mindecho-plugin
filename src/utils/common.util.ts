import dayjs from 'dayjs';
import { message } from 'antd';
import { getDocument as pdfGetDocument } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { ThinkingCopyObject } from '@/types';
import {useEffect, useRef} from 'react';

//获取数据最大限制
export const MAX_SIZE = 19999;

export const handleLogin = (success?: (result: any) => void, fail?: () => void) => {
  // 查询是否登录
  chrome.storage.local.get(['isLogin', 'userInfo']).then((result) => {
    console.log("🚀 ~ chrome.storage.local.get ~ result:", result)
    if ( result.isLogin && result.userInfo ) {
      success?.(result);
    }else {
      fail?.();
    }
  });
};

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
 * 打开设置页
 */
export function openSettings(path?: string) {
  console.log('🚀 ~ file: common.util.ts ~ line 21 ~ openSettings ~ path', path);
  chrome.runtime.sendMessage(
      {
        type: 'openSettings',
      },
      () => {
        //
      },
  );
}

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

/**
 * @description: 通过 url 提取 pdf 的文本
 * @param {string} pdfUrl pdf 的链接
 * @param {boolean} process 是否要在执行过程中抛出（用于进度条
 * @param {function} callback 回调方法，返回执行状态 status 和文本内容 textContent
 * @return {*}
 */
export const getPdfTextContent = async (
  { pdfUrl, process = false }: { pdfUrl: string; process?: boolean },
  callback: ({ status, result }: { status: string; result: any }) => void,
) => {
  const pdf = await pdfGetDocument(pdfUrl).promise;
  // 获取文档的元数据
  const metaData = await pdf.getMetadata();
  let title = '' ;
  let author = '';
  if (metaData.info) {
    title = (metaData.info as any).Title;
    author = (metaData.info as any).Author;
  }

  const total = pdf.numPages;
  let totalContent = '';
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const { items } = await page.getTextContent();
    if (!(Array.isArray(items) && items.length > 0)) return false;
    items.forEach((item: any) => (totalContent += item.str === '' ? '\n' : item.str));
  }
  title = title || totalContent.split('\n')[0];
  return { status: 'completed', result: {title, author, content: totalContent, info: metaData.info} };
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
