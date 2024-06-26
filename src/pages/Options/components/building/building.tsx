import React, { useEffect, useRef, useState, useContext } from 'react';
import { Progress } from 'antd';
import styles from './index.module.scss';
import Logo from '@/assets/icons/logo.png';
import GifArrow from '@/assets/icons/gif_arrow.png';
import Gif from '@/assets/icons/control.gif';
import QuestArrow from '@/assets/icons/quest_arrow.png';
import LogoText from '@/assets/icons/logo-font.png';
import './index.module.css';
import GlobalContext, { ActionType } from '@/reducer/global';
import { SetInterval } from '@/utils/common.util';
import _, { set } from 'lodash';

interface IProp {
  type: string;
}

const Building: React.FC<IProp> = ({ type = 'browser' }) => {
  const signUpWithGoogle = chrome.i18n.getMessage('signUpWithGoogle');
  const { state: { upateData, progress }, dispatch: globalDispatch } = useContext(GlobalContext);
  const [precent, setPrecent] = useState(0);
  const [done, setDone] = useState(false);
  const [waitTime, setWaitTime] = useState(null as any);
  const TIMEOUT = 600; //seconds 最长等待时间
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const MIN_TIMEOUT = 60; //最小等待时间

  useEffect(() => {
    upateUserUrl();
  }, [upateData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getProgress();
    }, 5000);

    setTimer(intervalId)

    return () => clearInterval(intervalId); // Ensure the interval is cleared when the component unmounts
  }, [waitTime]);

  const upateUserUrl = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'update_user_url', body: upateData }, (res) => {
      console.log('upateUserUrl res:', res);
      setWaitTime(0);
    });
  }

  const getProgress = () => {
    setWaitTime(waitTime + 5);
    chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
      console.log('user_url_status res:', res);
      globalDispatch({
        type: ActionType.SetProgress,
        payload: res || null,
      })
    });
  }

  useEffect(() => {
    if (_.isArray(progress) && waitTime > 0) {
      let count = 0;
      let pending = 0;
      (progress || []).forEach((item: any) => {
        count += item.count;
        if (item.status === 1 || item.status === 2) {
          pending += item.count;
        }
      })
      if (waitTime < TIMEOUT && pending) {
        const percent=Math.floor((count - pending) / count * 100)
        // console.info(`~percent: ${percent}, count: ${count}, pending: ${pending}`);
        // console.info(Math.ceil((count - pending) / count * 100))
        setPrecent(percent)
      } else {
        if (waitTime < MIN_TIMEOUT) {
          setPrecent(99)
          // 如果等待时间小于最小等待时间，即使所有任务完成，也不应该停止计时器或者标记为完成
          return; // 直接返回，不继续执行后面的逻辑
        }
        clearInterval(timer)
        setPrecent(100)
        setTimeout(() => { setDone(true) }, 1500)
      }
    }
    return () => { }
  }, [progress, waitTime])

  return (
    <div className={styles.container}>
      {
        done && (
          <div className={styles['top']}>
            <img className={styles['gif']} src={Gif} alt="gif" />
            <p className={styles['direction']}>From the Extension Bar Above</p>
            <img className={styles['git-arrow']} src={GifArrow} alt="" />
          </div>
        )
      }
      <div className={styles['content']}>
        <img className={`${styles['logo']} ${styles['logo-icon']}`} src={Logo} />
        {
          done ? (
            <>
              <p className={styles['title']}>{type === 'browser' ? 'Initialization Done!' : 'Pocket Saves Imported'}</p>
              <p className={styles['tip']}>The data's not all set just yet, but I'm on it, will get it done in the background</p>
              <p className={styles['title']} style={{ marginTop: '20px' }}>Meanwhile, You can start asking questions!</p>
              <p className={styles['tip-2']}>
                Feel free to <span className={styles['point-1']}>summon me</span> anytime by <span className={styles['point-2']}>clicking on the toolbar up top</span>, or with <span className={styles['point-3']}>quick keyboard shortcuts</span>, whenever you need to dive into your saved treasures.
              </p>
            </>
          ) : (
            <>
              <p className={styles['title']}>Building Your MindEcho</p>
              <p className={styles['tip']} style={{ display: done ? 'none' : 'block' }}>It may take up to 10 minutes</p>
              <Progress type="circle" percent={precent} style={{ marginTop: '30px' }} className={styles.progress} />
            </>
          )
        }
      </div>
      {
        done && (
          <div className={styles['bottom']}>
            <img src={QuestArrow} alt="" />
            <span className={styles['direction']}>Keyboard Stroke ShortCuts</span>
            <p className={styles['doneTip']}>
              Press <strong>Command + E</strong> on Mac
            </p>
            <p className={styles['doneTip']}>
              Press <strong>Ctrl + E</strong> on PC
            </p>
          </div>
        )
      }
    </div>

  );
};

export default Building;
