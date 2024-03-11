import React, { useEffect, useContext, useState, useMemo } from 'react';
import { Input, Button, Skeleton, message } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import GlobalContext, { ActionType } from '@/reducer/global';
import { SHARE_ORIGIN } from '@/constants';
import styles from './share.module.scss';

interface Props {
  loading: any;
}

interface ShareResult {
  distill_id: number;
  id: number;
  share_content: string;
  share_title: string;
  url: string;
  user_id: number;
}

const ShareComponent: React.FC<Props> = ({ loading }: Props) => {
  const { state: globalState } = useContext(GlobalContext);
  const { articleDistillId } = globalState;
  const [shareRusult, setShareRusult] = useState({} as ShareResult);

  useEffect(() => {
    // 查找页面中所有的 meta 标签
    const metaTags = document.querySelectorAll('meta');
    // 遍历所有的 meta 标签
    let mainImageSrc = '';
    for (let i = 0; i < metaTags.length; i++) {
      const tag = metaTags[i];
      // 检查每个 meta 标签的 property 属性是否为 "og:image"
      if (tag.getAttribute('property') === 'og:image') {
        // 获取 content 属性的值
        mainImageSrc = tag.getAttribute('content');
        break;
      }
    }
    console.log('🚀 ~ useEffect ~ mainImageSrc:', mainImageSrc);
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'getShareUrl',
        body: {
          article_distill_id: articleDistillId,
          share_title: document.title.replaceAll(' ', '-'),
          url: document.location.href,
          head_icon_url: mainImageSrc,
        },
      },
      (res) => {
        if (res) {
          loading();
          setShareRusult(res);
          console.log('getShareUrl', res);
        }
      },
    );
  }, []);

  const { shareUrl } = useMemo(() => {
    if (!shareRusult.url) return {};
    return {
      shareUrl: SHARE_ORIGIN + shareRusult.url,
    };
  }, [shareRusult]);

  return (
    <div className={styles.container}>
      {shareUrl ? (
        <>
          <div className="title">{chrome.i18n.getMessage('shareThisRead')}</div>
          <div className="copy-link">
            <Input value={shareUrl} />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  message.success(chrome.i18n.getMessage('copied'));
                });
              }}>
              {chrome.i18n.getMessage('shareCopyLink')}
              <LinkOutlined />
            </Button>
          </div>
        </>
      ) : (
        <Skeleton title={false} active />
      )}
    </div>
  );
};
export default ShareComponent;
