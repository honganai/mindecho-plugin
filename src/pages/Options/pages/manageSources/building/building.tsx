import React, { useEffect, useState, useContext } from 'react';
import styles from './index.module.scss';
import GifArrow from '@/assets/icons/gif_arrow.png';
import Gif from '@/assets/icons/control.gif';
import QuestArrow from '@/assets/icons/Vector 1.png';
import './index.module.css';
import GlobalContext from '@/reducer/global';
import _ from 'lodash';
import LoadingIcon from '@/assets/icons/loading_icon.png';
import Logo from '@/assets/icons/logo.png';
import cs from 'classnames';
import clsx from 'clsx';

interface IProp {
  type?:
  'xbookmark' |
  'browser' |
  'pocket' |
  ''
  status?: boolean;
}

const Building: React.FC<IProp> = ({ type = 'browser', status = false }) => {

  const { getMessage: t } = chrome.i18n;
  const { state: { updateData, }, dispatch: globalDispatch } = useContext(GlobalContext);
  const [done, setDone] = useState(false);
  const [waitTime, setWaitTime] = useState(null as any);
  const MIN_TIMEOUT = 5; //最小等待时间

  const typeLabelMap = {
    'xbookmark': t("Twitter Bookmark"),
    'browser': t('browser_data_imported'),
    'pocket': t('pocket_saves_imported'),
  }

  useEffect(() => {
    if (_.isArray(updateData) && updateData.length > 0) {
      upateUserUrl();
    }
  }, [updateData]);

  useEffect(() => {
    setTimeout(() => {

      setDone(true)
    }, 1000 * MIN_TIMEOUT)
  }, [waitTime]);

  const upateUserUrl = () => {
    chrome.runtime.sendMessage({ type: 'request', api: 'update_user_url', body: updateData }, (res) => {
      console.log('upateUserUrl res:', res);
      setWaitTime(0);
    });
  }

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
              <p className={styles['title']}>{typeLabelMap[type] || ''}</p>
              <p className={styles['tip']}>{t('data_is_still_processing_Im_on_it_and_will_continue_in_the_background')}</p>
              <p className={styles['tip-3']}>
                {t('activate_mindECHO_to_search_your_saves')}<br />
                {t('anytime_via')} <span style={{ color: '#6428be' }}>{t('keystroke')}</span> {t('or')} <span style={{ color: '#2b984d' }}>{t('icon_click')}</span>
              </p>
            </>
          ) : (
            <>
              <p className={clsx(
                styles['title'],

              )}>{t('building_your_mindEcho')}</p>
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
                {t('press')} <strong>Command + E</strong> {t('on_mac')}
              </p>
              <p className={styles['doneTip']}>
                {t('press')} <strong>Ctrl + E</strong> {t('on_pc')}
              </p>
            </div>
          </div>
        )
      }
    </div>

  );
};

export default Building;
