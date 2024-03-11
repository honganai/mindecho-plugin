import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import markdownit from 'markdown-it';
import styles from './index.module.scss';
import { message, Skeleton } from 'antd';
import GlobalContext from '@/reducer/global';
import GoalContent, { IHighLight } from '../GoalCard/GoalContent';
// import { HEIGHTLIGHT_COLORS as COLORS } from '@/constants';
import CopyIcon from '@/assets/icons/copy.svg';
import parse, { HTMLReactParserOptions, domToReact } from 'html-react-parser';

const COLORS = [
  {
    head: {
      text: '#70508F',
      back: '#d7ebf7',
    },
    body: {
      text: '#101010',
      back: '#f2f9ff',
    },
  },
];

interface IProps {
  markdownStream?: string;
  reciveEnd: boolean;
}

const colorIndex = 0;

const md = markdownit();

interface IContent {
  title: string;
  content: string;
  highLight?: [];
  html: string;
}

const copiedI18N = chrome.i18n.getMessage('copied');

const MarkdownContent: React.FC<IProps> = ({ markdownStream = '', reciveEnd }) => {
  const { state: globalState } = useContext(GlobalContext);
  const { content } = globalState.cleanArticle;
  const [highLight, setHighLight] = useState<Record<string, IHighLight[]>>({});
  const [updateData, setUpdateData] = useState<IHighLight[]>([]);

  const [data, setData] = useState<IContent[]>([]);
  const completeHighlight = useRef<string[]>([]); // 高亮完成记录

  // 请求高亮接口
  const requestHighLight = (text: string, callback: (res: IHighLight[]) => void) => {
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'highlightText',
        body: {
          article_content: content,
          search_text: text,
          url: window.location.href,
        },
        headers: {},
      },
      (res) => {
        callback?.(res);
      },
    );
  };

  const parseMd = (mdStr: string, complete: boolean) => {
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
        const tempKey = tempData.title;

        // 前一个段落已完成。可以请求高亮接口。最后一段的高亮请求放在reciveEnd之后
        if (contents.length > 0 && !completeHighlight.current.includes(tempKey)) {
          completeHighlight.current.push(tempKey);
          tempData.content.trim().length > 0 &&
            requestHighLight(tempData.content, (res) => {
              setHighLight((pre) => {
                return {
                  ...pre,
                  [tempKey]: res || [],
                };
              });
            });
        }
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
    if (complete) {
      const lastData = contents[contents.length - 1];
      if (lastData && !completeHighlight.current.includes(lastData.title)) {
        completeHighlight.current.push(lastData.title);
        requestHighLight(lastData.content, (res) => {
          setHighLight((pre) => {
            return {
              ...pre,
              [lastData.title]: res || [],
            };
          });
        });
      }
    }
    return contents;
  };

  useEffect(() => {
    setData(parseMd(markdownStream, reciveEnd));
  }, [markdownStream, reciveEnd]);

  useEffect(() => {
    if (updateData.length > 0) {
      console.log('🚀 ~ updateData:', {
        article_content: content,
        search_text: data[1].content,
        url: window.location.href,
        result_data: updateData,
      });
      chrome.runtime.sendMessage(
        {
          type: 'request',
          api: 'putHighlightText',
          body: {
            article_content: content,
            search_text: data[1].content,
            url: window.location.href,
            result_data: JSON.stringify(updateData),
          },
          headers: {},
        },
        (res) => {
          console.log('~ putHighlightText:', res);
        },
      );
    }
  }, [updateData]);

  const parsePptions: HTMLReactParserOptions = useMemo(() => {
    return {
      replace(domNode: any) {
        if (domNode.childNodes?.length === 1 && domNode.childNodes[0]?.type === 'text') {
          let highLightLi = '';

          highLightLi = domNode.childNodes[0]?.data;
          // filter -> find.只需要第一个匹配的高亮，有的话就整段高亮
          const highLightData = highLight[data[1]?.title.trim()]?.find((h) => {
            return (
              h.search_text?.trim().includes(highLightLi.trim()) ||
              highLightLi?.trim().includes((h.search_text || '').trim())
            );
          });
          return React.createElement(
            domNode.name,
            {},
            highLightLi ? (
              <GoalContent
                color={{
                  color: COLORS[colorIndex].body.back,
                  textColor: COLORS[colorIndex].body.text,
                  hoverColor: COLORS[colorIndex].head.back,
                }}
                content={highLightLi}
                highLight={highLightData ? [highLightData] : []}
                onUpdate={(data) => {
                  console.log('🚀 ~ replace ~ data:', data);
                  setUpdateData((pre) => {
                    return [...pre, data];
                  });
                }}
              />
            ) : (
              domToReact(domNode.children, parsePptions)
            ),
          );
        }
      },
    };
  }, [highLight]);

  return (
    <div>
      {data.map((item, index) => {
        return (
          <div key={index} className={styles.content}>
            {index !== 1 && <div className={styles.title}>{item.title}</div>}
            <div
              className={styles.copy}
              onClick={() => {
                navigator.clipboard.writeText([item.title, item.content.trim()].join('\r\n')).then(() => {
                  message.success('Copied to Clipboard');
                });
              }}>
              <CopyIcon />
            </div>
            <div className={styles['text-p']}>
              {index === 1 ? (
                // <div dangerouslySetInnerHTML={{ __html: item.html }}></div>
                parse(item.html, parsePptions)
              ) : (
                <GoalContent
                  color={{
                    color: COLORS[colorIndex].body.back,
                    textColor: COLORS[colorIndex].body.text,
                    hoverColor: COLORS[colorIndex].head.back,
                  }}
                  content={item.content.trim()}
                  highLight={highLight[item.title]}
                />
              )}
            </div>
          </div>
        );
      })}
      {!reciveEnd && <Skeleton title={false} active />}
    </div>
  );
};

export default MarkdownContent;
