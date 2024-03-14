import React, { useState } from 'react';
import styles from './index.module.scss';
import { Typography, Popover } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
const { Paragraph } = Typography;
interface Props {
  title: string;
  text: string;
}
const History: React.FC<Props> = ({ title, text }: Props) => {
  const [ellipsis, setEllipsis] = useState(true);

  const onEllipsis = () => {
    setEllipsis(!ellipsis);
  };

  return (
    <div className={styles.container}>
      <Popover content={''} title="Title">
        <div className="title">{title}</div>
      </Popover>
      <Paragraph className="paragraph-text" ellipsis={ellipsis ? { rows: 3 } : false}>
        {text}
      </Paragraph>
      <div className="ellipsis">
        {ellipsis ? (
          <DownOutlined onClick={onEllipsis} style={{ color: '#c6c6c6' }} />
        ) : (
          <UpOutlined onClick={onEllipsis} style={{ color: '#c6c6c6' }} />
        )}
      </div>
    </div>
  );
};

export default History;
