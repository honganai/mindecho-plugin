import React, { useEffect, useContext } from 'react';
import { Button, Spin, Modal } from 'antd';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import GlobalContext, { ActionType, IBookmarks, IHistory, IReadingList } from '@/reducer/global';
import BadIcon from '@/assets/icons/bad_icon.png'
import clsx from 'clsx';

interface Props {
  onLink: Function;
}

const Twitter: React.FC<Props> = ({ onLink }: Props) => {
  const { getMessage: t } = chrome.i18n;
  const { state: { }, dispatch: globalDispatch } = useContext(GlobalContext);

  useEffect(() => {
  }, []);

  const goTiwtter = () => {
    chrome.runtime.sendMessage({ type: 'twitter' }, (res) => {
      console.log('twitter res:', res);
    });
  }

  return (
    <div className={clsx(styles.container, 'flex-1 w-0')}>
      <div className={styles.content}>
        <div className={styles.title}>X Bookmarks</div>
        <p className={styles.tip}>
          Please first go to <span className={styles.backlink} onClick={goTiwtter}>X.com</span> to log in to your account.
        </p>
        <Button className={styles.btn}>I’ve Logged In. Go Get My X Bookmarks. </Button>
        <div className={styles.errBox}>
          <img src={BadIcon} alt="BadIcon" />
          <p>Not logged into X yet. </p>
          <p>Please try again:</p>
          <p>Go to <span className={styles.backlink}>https://x.com</span></p>
        </div>
      </div>
    </div>
  );
};

export default Twitter;
