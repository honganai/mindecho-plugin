import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import styles from './right-message.module.scss';

interface Props {
  message: string;
  link?: string;
}
const RightMessage: React.FC<Props> = ({ message, link }: Props) => {
  return (
    <div className={styles.container}>
      <div className="content">
        <div className="message">{message}</div>
        {link && (
          <div>
            <span className="link">{link}</span>
          </div>
        )}
      </div>

      <UserOutlined style={{ fontSize: '20px', color: '#3388ff' }} />
    </div>
  );
};
export default RightMessage;
