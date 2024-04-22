import React, { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Spin } from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { CONTACT_URL, SUBSCRIBE_URL } from '@/constants';
import cs from 'classnames';
import styles from './index.module.scss';
import _ from "lodash";
import posthog from "posthog-js";
import logo from '@/assets/icons/logo.png';
import GlobalContext, { ActionType, IBookmarks, IHistory, IReadingList } from '@/reducer/global';

interface Props {
  tip?: string;
  note?: string;
}

const Header: React.FC<Props> = ({ tip, note }) => {
  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { userInfo }, dispatch: globalDispatch } = useContext(GlobalContext);
  const el_userInfo = useRef(null);

  useEffect(() => {
    if (el_userInfo.current) {
      //console.log(11111111, el_userInfo.current, el_userInfo.current.offsetHeight)
    }
  }, []);

  return (
    <div className={styles['userInfo']} ref={el_userInfo}>
      <img className={styles['logo']} src={logo} alt="logo" />
      <div className={styles['userName']}>
        <p className={styles['name']}>Hello, {userInfo?.username || '-'}</p>
        <p className={styles['recommend']}>{tip || ''}</p>
        {
          note && <p className={styles['note']}><strong>Note:</strong> {note}</p>
        }
      </div>
    </div>
  );
};

export default Header;
