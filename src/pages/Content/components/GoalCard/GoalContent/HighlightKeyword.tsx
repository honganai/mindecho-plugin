import React, { useMemo } from 'react';
import { IKeywordOption, IKeywordParseResult, parseHighlightString } from '@/utils/highLightKeyword';
import cs from 'classnames';
import styles from './index.module.scss';

interface IProps {
  content: string;
  keywords: IKeywordOption[];
}

const HighlightKeyword: React.FC<IProps> = ({ content, keywords }) => {
  const renderList = useMemo(() => {
    if (keywords.length === 0) {
      return <div className={styles.paragraph}>{content}</div>;
    }
    return keywords[0].renderHighlightKeyword?.(
      <div className={cs(styles.paragraph, styles['highlight-paragraph'])}>{content}</div>,
    );
    // const splitList = parseHighlightString(content, keywords);

    // if (splitList.length === 0) {
    //   return <>{content}</>;
    // }
    // return splitList.map((item: IKeywordParseResult, i: number) => {
    //   const { subString, option = {} } = item;
    //   const { color, bgColor, style = {}, tagName = 'mark', renderHighlightKeyword } = option as IKeywordOption;
    //   if (typeof renderHighlightKeyword === 'function') {
    //     return <React.Fragment key={i}>{renderHighlightKeyword(subString as string)}</React.Fragment>;
    //   }
    //   if (!item.option) {
    //     return <React.Fragment key={i}>{subString}</React.Fragment>;
    //   }
    //   const TagName: any = tagName;
    //   return (
    //     <TagName
    //       key={`${i}`}
    //       style={{
    //         ...style,
    //         backgroundColor: bgColor || style.backgroundColor,
    //         color: color || style.color,
    //       }}>
    //       {subString}
    //     </TagName>
    //   );
    // });
  }, [content, keywords]);

  return renderList;
};

export default HighlightKeyword;
