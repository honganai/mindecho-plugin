import React, { useEffect, useRef, useState, useContext } from 'react';
import { Progress } from 'antd';
import styles from './index.module.scss';
import Logo from '@/assets/icons/logo.png';
import LogoText from '@/assets/icons/logo-font.png';
import './index.module.css';
import GlobalContext, { IUpateData } from '@/reducer/global';

const Building: React.FC = () => {
  const signUpWithGoogle = chrome.i18n.getMessage('signUpWithGoogle');
  const { state: { upateData }, dispatch: globalDispatch } = useContext(GlobalContext);
  const [precent, setPrecent] = useState(0);
  const [done, setDone] = useState(false);
  const [monitor, setMonitor] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const TIMEOUT = 60;

  useEffect(() => {
    upateUserUrl();
  }, []);

  const upateUserUrl = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'update_user_url', body: upateData }, (res) => {
      console.log('upateUserUrl res:', res);
      setMonitor(true)
    });
  }

  SetInterval(() => {
    monitor && getProgress();
  }, 5000)

  const getProgress = () => {
    setWaitTime(waitTime + 5);
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      console.log('getProgress res:', res);
      let count = 0;
      let pending = 0;
      res.forEach((item: any) => {
        count += item.count;
        if (item.status === 1) {
          pending += item.count;
        }
      })
      if (waitTime < TIMEOUT && pending) {
        setPrecent(Math.ceil((count - pending) / count * 100))
        return false;
      } else {
        setPrecent(100)
        setDone(true)
        return true;
      }
    });
  }



  return (
    <div className={styles.container}>
      <img className={`${styles['logo']} ${styles['logo-icon']}`} src={Logo} />
      <p className={styles['title']}>{done ? 'Done!' : 'Building Your MindEcho'}</p>
      <p className={styles['tip']} style={{ display: done ? 'none' : 'block' }}>It may take up to 10 minutes</p>
      <Progress type="circle" percent={precent} style={{ marginTop: '30px' }} />
      {
        done && (
          <>
            <p>now</p>
            <p className={styles['doneTip']}>
              Press <strong>Command + E</strong> on Mac
            </p>
            <p className={styles['doneTip']}>
              Press <strong>Ctrl + E</strong> on PC
            </p>
          </>
        )
      }
    </div>
  );
};

const SetInterval = (callback: Function, delay: number = 1000) => {
  const Ref = useRef<any>();

  Ref.current = () => {
    return callback();
  }
  useEffect(() => {
    const timer = setInterval(() => {
      Ref.current() && clearInterval(timer);
    }, delay);
    return () => {
      clearInterval(timer);
    }
  }, [delay]);
}

export default Building;
