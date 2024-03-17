import React, { useEffect, useState } from 'react';

import markdownit from 'markdown-it';
import styles from './index.module.scss';
import parse from 'html-react-parser';

interface IProps {
  markdownStream?: string;
}

const md = markdownit();

interface IContent {
  title: string;
  content: string;
  highLight?: [];
  html: string;
}

const MarkdownContent: React.FC<IProps> = ({ markdownStream = '' }) => {
  console.log('🚀 ~ markdownStream:', markdownStream);

  const [data, setData] = useState<IContent[]>([]);

  const parseMd = (mdStr: string) => {
    const container = document.createElement('div');
    container.innerHTML = md.render(mdStr); // 先把md转成html
    console.log('🚀 ~ parseMd ~ container.innerHTML:', container.innerHTML);

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
        if (node.nodeName === 'UL') {
          tempData.content += node.textContent?.trimEnd();
        } else {
          tempData.content += node.textContent;
        }
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

  return (
    <div>
      {data.map((item, index) => {
        return (
          <div key={index} className={styles.content}>
            <div className={styles['text-p']}>{parse(item.html)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default MarkdownContent;
