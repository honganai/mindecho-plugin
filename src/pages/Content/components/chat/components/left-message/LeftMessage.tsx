import React from 'react';
import { SlackOutlined } from '@ant-design/icons';
import styles from './left-message.module.scss';

interface Props {
  message: string;
  link?: string;
}
const LeftMessage: React.FC<Props> = ({ message, link }: Props) => {
  return (
    <div className={styles.container}>
      <SlackOutlined style={{ fontSize: '20px' }} />
      <div className="content">
        <div className="message">{message}</div>
        {link && (
          <div>
            <span className="link">{link}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default LeftMessage;
