import React, { useState } from 'react';
import { Dropdown } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { ShareOne } from '@icon-park/react';
import ShareComponent from './components/share';
import { getDocument } from '@/utils/common.util';

import styles from './index.module.scss';

const Share: React.FC = () => {
  const [shareLoading, setShareLoading] = useState(false);
  const getPopupContainer = (triggerNode: any) => {
    if (triggerNode && triggerNode.parentNode) {
      return triggerNode.parentNode;
    }
    return getDocument().getElementById('share-container');
  };

  return (
    <div id="share-container" className={styles.container}>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        destroyPopupOnHide={true}
        getPopupContainer={getPopupContainer}
        onOpenChange={(open) => {
          setShareLoading(open);
        }}
        dropdownRender={() => <ShareComponent loading={() => setShareLoading(false)} />}>
        <div className="share-btn">
          {shareLoading ? (
            <LoadingOutlined className="share-btn__icon" />
          ) : (
            <ShareOne className="share-btn__icon" theme="outline" />
          )}
          {chrome.i18n.getMessage('shareBtn')}
        </div>
      </Dropdown>
    </div>
  );
};
export default Share;
