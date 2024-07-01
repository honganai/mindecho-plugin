import React, { useEffect, useState, memo } from 'react';
import markdownit from 'markdown-it';
import styles from './index.module.scss';
import parse, { HTMLReactParserOptions, domToReact } from 'html-react-parser';
import { ReloadOutlined, CopyOutlined, FileDoneOutlined } from '@ant-design/icons';
import { message } from 'antd';

interface IProps {
  markdownStream?: string;
  refresh: Function;
}

const md = markdownit({
  breaks: true // \n换行
});

// a标签打开新tab
// Remember the old renderer if overridden, or proxy to the default renderer.
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Add a new `target` attribute, or replace the value of the existing one.
  tokens[idx].attrSet('target', '_blank');

  // Pass the token to the default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

interface IContent {
  title: string;
  content: string;
  highLight?: [];
  html: string;
}

const MarkdownContent: React.FC<IProps> = ({ markdownStream = '', refresh }) => {
  const [data, setData] = useState<IContent[]>([]);
  const [copyStatus, setCopyStatus] = useState(false);
  const { getMessage: t } = chrome.i18n;
  const copyFailedI18N = t('copyFailed');
  const copySuccessI18N = t('copySuccess');
  const copyNotSupportedI18N = t('copyNotSupported');

  const parseMd = (mdStr: string) => {
    const container = document.createElement('div');
    container.innerHTML = md.render(mdStr); // 先把md转成html

    const contents: IContent[] = []; // 段落数组

    let tempData = {
      title: '',
      content: '',
      html: '',
    };
    container.childNodes.forEach((node) => {
      // 每个h3作为一个段落
      if (node.nodeName === 'H3') {
        const title = node.textContent || '';

        // 创建一个新段落
        tempData = {
          title,
          content: '',
          html: '',
        };
        contents.push(tempData);
      } else {
        tempData.content += node.textContent;
      }

      if ((node as Element).outerHTML) {
        tempData.html += (node as Element).outerHTML;
      }
    });
    return contents;
  };

  useEffect(() => {
    setData(parseMd(markdownStream));
  }, [markdownStream]);

  // const parsePptions: HTMLReactParserOptions = {
  //   replace(domNode: any) {
  //     if (domNode.name === 'p' && domNode.children.length === 1 && domNode.children[0].data === 'Bookmarks') {
  //       return <p className={styles.quote}>{domToReact(domNode.children, parsePptions)}</p>
  //     }
  //   }
  // };

  const copyText = () => {
    if (navigator?.clipboard) {
      setCopyStatus(true);
      setTimeout(() => {
        setCopyStatus(false);
      }, 3000)
      navigator.clipboard.writeText(data[0]?.content || copyFailedI18N);
      message.success(copySuccessI18N);
    } else {
      message.error(copyNotSupportedI18N);
    }
  }

  return (
    <div>
      {data.map((item, index) => {
        return (
          <div key={index} className={styles.content}>
            <div className={styles.controls}>
              <ReloadOutlined onClick={() => refresh()} />
              {
                copyStatus ? <FileDoneOutlined /> : <CopyOutlined onClick={copyText} />
              }
            </div>
            <div className={styles['text-p']}>{parse(item.html)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(MarkdownContent);
