import React from 'react';
import { Button } from 'antd';

import styles from './index.module.scss';

interface IProps {
  text: string;
  desc: string;
  dom: HTMLElement;
  onNext: () => void;
  scroll?: {
    left: number;
    top: number;
  };
  contentRef: React.RefObject<HTMLElement>;
  rect: DOMRect;
  isLast: boolean;
  position?: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };
}

const Step: React.FC<IProps> = ({ text, onNext, rect, desc, isLast, position = {} }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: rect.top - 5,
        left: 5,
        right: 5,
        height: rect.height + 10,
        border: '5px dashed #939393',
      }}>
      <div
        className={styles['step-content']}
        style={
          position
            ? {
                ...position,
              }
            : {}
        }>
        <div className={styles.title}>{text}</div>
        <div className={styles.desc}>{desc}</div>
        <div className={styles.next}>
          <Button type="link" onClick={() => onNext()}>
            {isLast ? chrome.i18n.getMessage('guideComplete') : chrome.i18n.getMessage('guideNext')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step;
