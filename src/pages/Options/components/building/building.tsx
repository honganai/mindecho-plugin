import React, { useEffect, useRef, useState, useContext } from 'react';
import styles from './index.module.scss';
import GifArrow from '@/assets/icons/gif_arrow.png';
import Gif from '@/assets/icons/control.gif';
import QuestArrow from '@/assets/icons/quest_arrow.png';
import './index.module.css';
import GlobalContext, { ActionType } from '@/reducer/global';
import _, { set } from 'lodash';
import LoadingIcon from '@/assets/icons/loading_icon.png';
import Logo from '@/assets/icons/logo.png';
import cs from 'classnames';
import { Trumpet } from '@icon-park/react';

interface IProp {
  type: string;
  status: boolean;
}

const Building: React.FC<IProp> = ({ type = 'browser', status = false }) => {
  const { getMessage: t } = chrome.i18n;
  const { state: { upateData, progress }, dispatch: globalDispatch } = useContext(GlobalContext);
  const [precent, setPrecent] = useState(0);
  const [done, setDone] = useState(status);
  const [waitTime, setWaitTime] = useState(null as any);
  const TIMEOUT = 600; //seconds 最长等待时间
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const MIN_TIMEOUT = 60; //最小等待时间

  useEffect(() => {
    !status && upateUserUrl();
  }, [upateData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      !status && getProgress();
    }, 5000);

    setTimer(intervalId)

    return () => clearInterval(intervalId); // Ensure the interval is cleared when the component unmounts
  }, [waitTime, status]);

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
        const percent = Math.floor((count - pending) / count * 100)
        setPrecent(percent)
      } else {
        if (waitTime < MIN_TIMEOUT) {
          setPrecent(99)
          // 如果等待时间小于最小等待时间，即使所有任务完成，也不应该停止计时器或者标记为完成
        } else {
          clearInterval(timer)
          setPrecent(100)
          setTimeout(() => { setDone(true) }, 1500)
        }
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
            <p className={styles['direction']}>{t('from_the_extension_bar_above')}</p>
            <img className={styles['git-arrow']} src={GifArrow} alt="" />
          </div>
        )
      }
      <div className={styles['content']}>
        <img className={cs(styles['logo'], styles['logo-icon'])} src={Logo} />
        {
          done ? (
            <>
              <p className={styles['title']}>{type === 'browser' ? t('browser_data_imported') : t('pocket_saves_imported')}</p>
              <p className={styles['tip']}>{t('data_is_still_processing_Im_on_it_and_will_continue_in_the_background')}</p>
              <p className={styles['tip-3']}>
                {t('activate_mindECHO_to_search_your_saves')}<br />
                {t('anytime_via')} <span style={{ color: '#6428be' }}>{t('keystroke')}</span> {t('or')} <span style={{ color: '#2b984d' }}>{t('icon_click')}</span>
              </p>
              {/* <p className={styles['title']} style={{ marginTop: '20px' }}>Meanwhile, You can start asking questions!</p> */}
              {/* <p className={styles['tip-2']}>
                Feel free to <span className={styles['point-1']}>summon me</span> anytime by <span className={styles['point-2']}>clicking on the toolbar up top</span>, or with <span className={styles['point-3']}>quick keyboard shortcuts</span>, whenever you need to dive into your saved treasures.
              </p> */}
            </>
          ) : (
            <>
              <p className={styles['title']}>{t('building_your_mindEcho')}</p>
              <p className={styles['tip']} style={{ display: done ? 'none' : 'block' }}>{t('this_may_take_up_to_10_minutes_please_keep_this_page_open_and_continue_with_other_tasks')}</p>
              {/* <Progress type="circle" percent={precent} style={{ marginTop: '30px' }} className={styles.progress} /> */}
              <img className={styles['loading-icon']} src={LoadingIcon} alt="loading" />
            </>
          )
        }
      </div>
      {
        done && (
          <div className={styles['bottom']}>
            <img src={QuestArrow} alt="" />
            <span className={styles['direction']}>{t('keyboard_stroke_shortCuts')}</span>
            <div>
              <p className={styles['doneTip']}>
                {t('press')} <strong>{t('command_E')}</strong> {t('on_mac')}
              </p>
              <p className={styles['doneTip']}>
                {t('press')} <strong>{t('ctrl_E')}</strong> {t('on_pc')}
              </p>
            </div>
          </div>
        )
      }
    </div>

  );
};

export default Building;
