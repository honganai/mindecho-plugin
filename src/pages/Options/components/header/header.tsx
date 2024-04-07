import React, { useEffect, useContext } from 'react';
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
}

const Header: React.FC<Props> = ({ tip }: Props) => {
  const logoutText = chrome.i18n.getMessage('logout');
  const { state: { userInfo }, dispatch: globalDispatch } = useContext(GlobalContext);

  return (
    <div className={styles['userInfo']}>
      <img className={styles['logo']} src={logo} alt="logo" />
      <div className={styles['userName']}>
        <p className={styles['name']}>Hello, {userInfo?.username || '-'}</p>
        <p className={styles['recommend']}>{tip || ''}</p>
      </div>
    </div>
  );
};

export default Header;
